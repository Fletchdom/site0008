const params = new URLSearchParams(location.search);
const page = document.body.dataset.page;
const items = Array.isArray(window.SITE_ITEMS) ? window.SITE_ITEMS : [];

const hot = (list) => [...list].sort((a, b) => Number(b.hot || 0) - Number(a.hot || 0));
const score = (list) => [...list].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
const year = (list) => [...list].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));

function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function img(item) {
  return `<img src="${esc(item.poster)}" alt="${esc(item.title)}" loading="eager" decoding="async">`;
}

function href(item) {
  return `./movie.html?id=${encodeURIComponent(item.id)}`;
}

function originalLine(item, className = "") {
  if (/[A-Za-z]/.test(String(item.originalTitle || ""))) return "";
  return `<p${className ? ` class="${className}"` : ""}>${item.originalTitle}</p>`;
}

function tile(item, size = "") {
  return `<article class="tile ${size}">
    <a href="${href(item)}">
      <div class="cover">${img(item)}<span>${item.kind}</span></div>
      <div class="tile-copy">
        <h3>${item.title}</h3>
        ${originalLine(item)}
        <div><b>${item.score}</b><em>${item.year}</em><em>${item.genre}</em></div>
      </div>
    </a>
  </article>`;
}

function channel(kind, title, note) {
  const list = hot(items.filter((item) => item.kind === kind));
  const first = list[0] || items[0];
  return `<a class="channel" href="./library.html?kind=${encodeURIComponent(kind)}">
    ${first ? img(first) : ""}
    <span><b>${title}</b><small>${list.length} 部 · ${note}</small></span>
  </a>`;
}

function textLink(item, index) {
  return `<a class="text-link" href="${href(item)}"><span>${String(index + 1).padStart(2, "0")}</span><b>${item.title}</b><em>${item.score}</em></a>`;
}

function collection(title, note, list, id) {
  const root = document.getElementById(id);
  if (!root) return;
  root.innerHTML = `<div class="section-head"><div><h2>${title}</h2><p>${note}</p></div><a href="./library.html">更多</a></div>
    <div class="collection-grid">${list.map((item, index) => tile(item, index === 0 ? "feature-tile" : "")).join("")}</div>`;
}

function renderHome() {
  const all = hot(items);
  const hero = all.find((item) => item.kind === "电影") || all[0];
  const picked = new Set([hero.id]);
  const side = ["日剧", "动漫电影"]
    .map((kind) => hot(items.filter((item) => item.kind === kind && !picked.has(item.id)))[0])
    .filter(Boolean);
  while (side.length < 2) {
    const next = all.find((item) => !picked.has(item.id) && !side.some((entry) => entry.id === item.id));
    if (!next) break;
    side.push(next);
  }
  side.slice(0, 2).forEach((item) => picked.add(item.id));
  const movies = hot(items.filter((item) => item.kind === "电影")).slice(0, 7);
  const dramas = hot(items.filter((item) => item.kind === "日剧")).slice(0, 7);
  const anime = hot(items.filter((item) => item.kind === "动漫电影")).slice(0, 7);

  document.getElementById("heroMain").innerHTML = `<a href="${href(hero)}">${img(hero)}
    <div class="hero-copy"><p>今日推荐 · ${hero.kind}</p><h1>${hero.title}</h1><span>${hero.score} 分 · ${hero.year} · ${hero.genre}</span></div></a>`;
  document.getElementById("heroSide").innerHTML = side.map((item) => tile(item, "side-tile")).join("");
  document.getElementById("channels").innerHTML = [
    channel("电影", "日本电影", "经典日影与院线佳作"),
    channel("日剧", "热门日剧", "都市悬疑与生活剧集"),
    channel("动漫电影", "动漫电影", "剧场版与高分动画"),
    channel("综艺纪录", "综艺纪录", "旅行美食与人物纪实")
  ].join("");
  document.getElementById("rankList").innerHTML = score(items).slice(0, 10).map(textLink).join("");
  document.getElementById("freshList").innerHTML = year(items).slice(0, 10).map(textLink).join("");
  collection("日本电影精选", "真实海报、剧情片、经典导演作品", movies, "movieCollection");
  collection("热门日剧追看", "高口碑日剧与热门剧集资料", dramas, "dramaCollection");
  collection("动漫电影推荐", "适合周末观看的动画电影", anime, "animeCollection");
  document.getElementById("dailyGrid").innerHTML = all.slice(0, 42).map((item) => tile(item)).join("");
}

function getList() {
  const kind = params.get("kind") || "全部";
  const q = (params.get("q") || "").trim().toLowerCase();
  const sort = params.get("sort") || document.getElementById("sortSelect")?.value || "hot";
  let list = [...items];
  if (kind !== "全部") list = list.filter((item) => item.kind === kind);
  if (q) list = list.filter((item) => `${item.title} ${item.originalTitle} ${item.kind} ${item.genre} ${item.summary}`.toLowerCase().includes(q));
  if (sort === "score") list = score(list);
  else if (sort === "year") list = year(list);
  else list = hot(list);
  return { list, kind, q };
}

function renderLibrary() {
  document.querySelectorAll("[data-kind]").forEach((button) => {
    button.onclick = () => {
      const next = new URLSearchParams(location.search);
      const kind = button.dataset.kind;
      if (kind === "全部") next.delete("kind");
      else next.set("kind", kind);
      location.href = `./library.html${next.toString() ? `?${next}` : ""}`;
    };
  });

  const search = document.getElementById("searchInput");
  search.value = params.get("q") || "";
  document.getElementById("searchForm").onsubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(location.search);
    const value = search.value.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    location.href = `./library.html${next.toString() ? `?${next}` : ""}`;
  };

  const sortSelect = document.getElementById("sortSelect");
  sortSelect.value = params.get("sort") || "hot";
  sortSelect.onchange = () => {
    const next = new URLSearchParams(location.search);
    next.set("sort", sortSelect.value);
    location.href = `./library.html?${next}`;
  };

  const { list, kind, q } = getList();
  document.getElementById("libraryTitle").textContent = q ? `搜索：${q}` : kind === "全部" ? "全部内容" : kind;
  document.getElementById("resultCount").textContent = `${list.length} 部`;
  document.getElementById("libraryGrid").innerHTML = list.map((item) => tile(item)).join("");
}

function renderDetail() {
  const item = items.find((entry) => entry.id === params.get("id")) || items[0];
  document.title = `${item.title}-日本电影高清详情`;
  document.querySelector("meta[name='description']").setAttribute("content", item.summary);
  document.getElementById("detailRoot").innerHTML = `
    <div class="detail-cover">${img(item)}</div>
    <article class="detail-copy">
      <p class="label">${item.kind} · ${item.genre}</p>
      <h1>${item.title}</h1>
      ${originalLine(item, "origin")}
      <div class="badges"><span>${item.score} 分</span><span>${item.year}</span><span>${item.genre}</span></div>
      <p>${item.summary}</p>
      <a class="button" href="./library.html?kind=${encodeURIComponent(item.kind)}">查看同类内容</a>
    </article>`;
  const related = hot(items.filter((entry) => entry.id !== item.id && (entry.kind === item.kind || entry.genre === item.genre))).slice(0, 12);
  document.getElementById("relatedGrid").innerHTML = related.map((entry) => tile(entry)).join("");
}

function markBrokenImages() {
  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => image.closest(".tile,.hero-main,.channel,.detail-cover")?.classList.add("image-missing"), { once: true });
  });
}

if (items.length) {
  if (page === "home") renderHome();
  if (page === "library") renderLibrary();
  if (page === "detail") renderDetail();
  markBrokenImages();
}
