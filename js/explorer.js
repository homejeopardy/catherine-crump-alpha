/* Interactive publications explorer — reads PUBLICATIONS from publications-data.js */
(() => {
  const root = document.getElementById("explorer");
  if (!root || typeof PUBLICATIONS === "undefined") return;

  const CAT_LABEL = { book: "Books & Chapters", article: "Articles", press: "Popular Press" };

  // topic keyword map — a pub can carry several topics
  const TOPIC_RULES = [
    ["Surveillance", /surveillance|drone|aerial|snatchers|tracked|tracking|monitor/i],
    ["Location Tracking", /gps|license plate|location|burner|call database|cell phone|hemisphere/i],
    ["Policing", /police|body camera|dashcam|policing|procurement|\bcop\b|dashcam/i],
    ["Privacy", /privacy|data retention|anonymity|digital privacy|snatchers/i],
    ["Youth Justice", /youth|juvenile|kid-friendly|electronic monitoring of youth/i],
    ["Free Speech", /speech|clerkship|student/i],
    ["Tech & IP", /google|oracle|copyright|multimedia|intellectual property/i],
  ];
  function topicsFor(p) {
    const hay = (p.title + " " + p.cite + " " + p.authors).toLowerCase();
    const t = TOPIC_RULES.filter(([, rx]) => rx.test(hay)).map(([name]) => name);
    return t.length ? t : ["Other"];
  }

  const DATA = PUBLICATIONS.map((p, i) => ({ ...p, i, y: parseInt(p.year, 10), topics: topicsFor(p) }));

  // state
  const state = { q: "", cat: "all", topics: new Set(), year: null, sort: "new" };

  // ---- build controls ----
  const topicCounts = {};
  DATA.forEach((p) => p.topics.forEach((t) => (topicCounts[t] = (topicCounts[t] || 0) + 1)));
  const topicList = Object.keys(topicCounts).sort((a, b) => topicCounts[b] - topicCounts[a]);

  root.innerHTML = `
    <div class="exp-controls">
      <div class="exp-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="exp-q" type="search" placeholder="Search titles, venues, co-authors…" autocomplete="off" />
      </div>
      <select class="exp-sort" id="exp-sort" aria-label="Sort">
        <option value="new">Newest first</option>
        <option value="old">Oldest first</option>
        <option value="az">Title A–Z</option>
      </select>
    </div>
    <div class="chips" id="exp-cats">
      <button class="chip on" data-cat="all">All work</button>
      <button class="chip" data-cat="book">Books &amp; Chapters <span class="c-count">${DATA.filter(p=>p.category==="book").length}</span></button>
      <button class="chip" data-cat="article">Articles <span class="c-count">${DATA.filter(p=>p.category==="article").length}</span></button>
      <button class="chip" data-cat="press">Popular Press <span class="c-count">${DATA.filter(p=>p.category==="press").length}</span></button>
    </div>
    <div class="chips" id="exp-topics">
      ${topicList.map((t) => `<button class="chip" data-topic="${t}">${t} <span class="c-count">${topicCounts[t]}</span></button>`).join("")}
    </div>
    <div class="year-viz" id="exp-viz"></div>
    <div class="exp-meta" id="exp-meta"></div>
    <div id="exp-list"></div>
  `;

  const $q = root.querySelector("#exp-q");
  const $sort = root.querySelector("#exp-sort");
  const $cats = root.querySelector("#exp-cats");
  const $topics = root.querySelector("#exp-topics");
  const $viz = root.querySelector("#exp-viz");
  const $meta = root.querySelector("#exp-meta");
  const $list = root.querySelector("#exp-list");

  // ---- year viz ----
  const years = [...new Set(DATA.map((p) => p.y))].sort((a, b) => a - b);
  const minY = years[0], maxY = years[years.length - 1];
  const allYears = [];
  for (let y = minY; y <= maxY; y++) allYears.push(y);
  const yearCount = (y) => DATA.filter((p) => p.y === y).length;
  const maxCount = Math.max(...allYears.map(yearCount), 1);
  $viz.innerHTML = allYears.map((y) => {
    const c = yearCount(y);
    return `<div class="year-bar" data-year="${y}" title="${y}: ${c} publication${c!==1?"s":""}">
      <div class="bar" style="height:${c ? (c / maxCount) * 100 : 3}%"></div>
      <div class="yl">${(y % 10 === 0 || y === minY || y === maxY) ? y : "’" + String(y).slice(2)}</div>
    </div>`;
  }).join("");

  function pubHTML(p) {
    const links = (p.links || []).map((l) =>
      l.url ? `<a class="p-link" href="${l.url}" target="_blank" rel="noopener">${l.label} →</a>`
            : `<span class="p-link" style="opacity:.5">${l.label}</span>`).join("");
    const tags = p.topics.map((t) => `<span class="p-tag">${t}</span>`).join("");
    return `<article class="pub">
      <div class="p-yr">${p.year}</div>
      <div>
        <h4>${p.title}</h4>
        <p class="p-auth">${p.authors}</p>
        <p class="p-cite">${p.cite}</p>
        <div class="p-tags">${tags}</div>
        <div class="p-links">${links}</div>
      </div>
    </article>`;
  }

  function apply() {
    let out = DATA.filter((p) => {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      if (state.year && p.y !== state.year) return false;
      if (state.topics.size && ![...state.topics].every((t) => p.topics.includes(t))) return false;
      if (state.q) {
        const hay = (p.title + " " + p.authors + " " + p.cite + " " + p.topics.join(" ")).toLowerCase();
        if (!hay.includes(state.q.toLowerCase())) return false;
      }
      return true;
    });
    out.sort((a, b) =>
      state.sort === "az" ? a.title.localeCompare(b.title) :
      state.sort === "old" ? a.y - b.y || a.title.localeCompare(b.title) :
      b.y - a.y || a.title.localeCompare(b.title));

    $meta.textContent = `${out.length} of ${DATA.length} works` +
      (state.year ? ` · ${state.year}` : "") +
      (state.topics.size ? ` · ${[...state.topics].join(", ")}` : "");
    $list.innerHTML = out.length ? out.map(pubHTML).join("")
      : `<p class="exp-empty">No publications match those filters. <a href="#" id="exp-clear">Clear filters →</a></p>`;
    const clear = root.querySelector("#exp-clear");
    if (clear) clear.addEventListener("click", (e) => { e.preventDefault(); reset(); });
  }

  function reset() {
    state.q = ""; state.cat = "all"; state.topics.clear(); state.year = null;
    $q.value = "";
    $cats.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.cat === "all"));
    $topics.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
    $viz.querySelectorAll(".year-bar").forEach((b) => b.classList.remove("on"));
    apply();
  }

  // ---- events ----
  $q.addEventListener("input", () => { state.q = $q.value.trim(); apply(); });
  $sort.addEventListener("change", () => { state.sort = $sort.value; apply(); });
  $cats.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.cat = b.dataset.cat;
    $cats.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
    apply();
  });
  $topics.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const t = b.dataset.topic;
    if (state.topics.has(t)) { state.topics.delete(t); b.classList.remove("on"); }
    else { state.topics.add(t); b.classList.add("on"); }
    apply();
  });
  $viz.addEventListener("click", (e) => {
    const b = e.target.closest(".year-bar"); if (!b) return;
    const y = parseInt(b.dataset.year, 10);
    state.year = state.year === y ? null : y;
    $viz.querySelectorAll(".year-bar").forEach((x) => x.classList.toggle("on", state.year && +x.dataset.year === state.year));
    apply();
  });

  // Focus cards elsewhere on the page can drive the explorer
  document.querySelectorAll("[data-focus-topic]").forEach((el) => {
    el.addEventListener("click", () => {
      const t = el.dataset.focusTopic;
      reset();
      const chip = $topics.querySelector(`.chip[data-topic="${t}"]`);
      if (chip) { state.topics.add(t); chip.classList.add("on"); apply(); }
    });
  });

  apply();
})();
