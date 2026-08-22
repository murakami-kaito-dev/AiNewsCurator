/* ANTENNA app shell v2 — ドキュメント型IA
 * ルート:
 *   #/trends            最新号
 *   #/trends/archive    号一覧
 *   #/trends/<version>  過去号
 *   #/<section>         セクションのランディング(子ページカード)
 *   #/<section>/<slug>  記事ページ
 *   #/glossary          用語辞典(絞り込み)
 *   #/glossary/<slug>   用語ページ
 *   #/search            サイト内検索
 * コンテンツは content/ 配下のJSONのみ。スキーマは .claude/docs/content-guide.md が正。
 */
"use strict";

const contentEl = document.getElementById("content");
const tabScroll = document.getElementById("tab-scroll");
const cache = {};
let SITE = null;

async function loadJSON(path) {
  if (!cache[path]) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    cache[path] = await res.json();
  }
  return cache[path];
}

/* ---------- theme ---------- */
const themeToggle = document.getElementById("theme-toggle");
function applyTheme(t) {
  if (t === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  localStorage.setItem("antenna-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === "light" ? "#F5F6FA" : "#10131F";
}
applyTheme(localStorage.getItem("antenna-theme") ||
  (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

/* ---------- 受信中ストリーム(シグネチャ演出) ---------- */
const STREAM_WORDS = [
  "attention is all you need", "MCP", "RAG", "agentic loop", "RLHF",
  "context window", "fine-tuning", "multimodal", "inference", "scaling laws",
  "tool use", "harness engineering", "next-token prediction", "embeddings",
];
(function startStream() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = document.getElementById("receiving-stream");
  if (!host) return;
  const span = document.createElement("span");
  host.appendChild(span);
  let i = 0;
  setInterval(() => {
    span.classList.remove("on");
    setTimeout(() => {
      i = (i + 1) % STREAM_WORDS.length;
      span.textContent = STREAM_WORDS[i];
      span.classList.add("on");
    }, 650);
  }, 3400);
  span.textContent = STREAM_WORDS[0];
  span.classList.add("on");
})();

/* ---------- utils ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function chip(text) { return el("span", "chip", text); }

/* [[glossary:slug|label]] / [[page:section/slug|label]] をリンクに展開 */
const LINK_RE = /\[\[(glossary|page):([a-z0-9\/-]+)\|([^\]]+)\]\]/g;
function richText(text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(LINK_RE)) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = el("a", "term-link", m[3]);
    a.href = m[1] === "glossary" ? `#/glossary/${m[2]}` : `#/${m[2]}`;
    frag.appendChild(a);
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}
function pRich(cls, text) { const p = el("p", cls); p.appendChild(richText(text)); return p; }
function stripLinks(text) { return text.replace(LINK_RE, "$3"); }

function breadcrumb(host, items) {
  const nav = el("nav", "breadcrumb");
  items.forEach(([label, href], i) => {
    if (i > 0) nav.appendChild(el("span", "bc-sep", "/"));
    if (href) { const a = el("a", null, label); a.href = href; nav.appendChild(a); }
    else nav.appendChild(el("span", "bc-here", label));
  });
  host.appendChild(nav);
}

function header(host, title, lede, updated) {
  if (updated) host.appendChild(el("p", "updated-line", `LAST RECEIVED: ${updated}`));
  host.appendChild(el("h1", "tab-title", title));
  if (lede) host.appendChild(pRich("tab-lede", lede));
}

function cardLink(href, title, summary, tag) {
  const a = el("a", "page-card");
  a.href = href;
  if (tag) a.appendChild(chip(tag));
  a.appendChild(el("h3", null, title));
  if (summary) a.appendChild(el("p", null, summary));
  a.appendChild(el("span", "card-arrow", "→"));
  return a;
}

/* ---------- ブロック描画 ---------- */
function renderBlocks(host, blocks) {
  for (const b of blocks) {
    switch (b.type) {
      case "h2": host.appendChild(el("h2", "doc-h2", b.text)); break;
      case "p": host.appendChild(pRich("doc-p", b.text)); break;
      case "list": {
        const ul = el("ul", "doc-list");
        for (const it of b.items) { const li = el("li"); li.appendChild(richText(it)); ul.appendChild(li); }
        host.appendChild(ul); break;
      }
      case "table": {
        const wrap = el("div", "table-wrap");
        const t = el("table", "doc-table");
        const thead = el("thead"); const trh = el("tr");
        for (const h of b.headers) trh.appendChild(el("th", null, h));
        thead.appendChild(trh); t.appendChild(thead);
        const tbody = el("tbody");
        for (const row of b.rows) {
          const tr = el("tr");
          for (const c of row) { const td = el("td"); td.appendChild(richText(String(c))); tr.appendChild(td); }
          tbody.appendChild(tr);
        }
        t.appendChild(tbody); wrap.appendChild(t); host.appendChild(wrap); break;
      }
      case "analogy": {
        const d = el("div", "analogy");
        d.appendChild(el("b", null, "例え話"));
        d.appendChild(pRich(null, b.body));
        host.appendChild(d); break;
      }
      case "callout": {
        const d = el("div", "why");
        d.appendChild(el("b", null, b.title || "補足"));
        d.appendChild(richText(b.body));
        host.appendChild(d); break;
      }
      case "demo": {
        if (window.DEMOS && window.DEMOS[b.id]) {
          const frame = el("div", "demo-frame");
          window.DEMOS[b.id](frame);
          host.appendChild(frame);
        }
        break;
      }
      case "links": {
        const sec = el("div", "next-steps");
        sec.appendChild(el("h2", "doc-h2", "次のステップ"));
        const grid = el("div", "card-grid");
        for (const it of b.items) {
          const href = it.to.startsWith("glossary:") ? `#/glossary/${it.to.slice(9)}` :
            it.to.startsWith("page:") ? `#/${it.to.slice(5)}` : `#/${it.to}`;
          grid.appendChild(cardLink(href, it.label, it.note));
        }
        sec.appendChild(grid); host.appendChild(sec); break;
      }
    }
  }
}

/* ---------- セクション描画 ---------- */
function renderLanding(section) {
  header(contentEl, section.label, section.lede);
  const grid = el("div", "card-grid");
  section.pages.forEach((p, i) => {
    grid.appendChild(cardLink(`#/${section.id}/${p.slug}`, p.title, p.summary, String(i + 1).padStart(2, "0")));
  });
  contentEl.appendChild(grid);
}

async function renderArticle(section, slug) {
  const idx = section.pages.findIndex(p => p.slug === slug);
  if (idx < 0) return renderNotFound();
  const data = await loadJSON(`content/pages/${section.id}/${slug}.json`);
  breadcrumb(contentEl, [[section.label, `#/${section.id}`], [data.title, null]]);
  header(contentEl, data.title, data.lede, data.updated);
  renderBlocks(contentEl, data.blocks);
  const nav = el("div", "prevnext");
  const prev = section.pages[idx - 1], next = section.pages[idx + 1];
  if (prev) { const a = el("a", "pn pn-prev"); a.href = `#/${section.id}/${prev.slug}`; a.appendChild(el("span", "pn-dir", "← 前")); a.appendChild(el("span", "pn-title", prev.title)); nav.appendChild(a); }
  else nav.appendChild(el("span"));
  if (next) { const a = el("a", "pn pn-next"); a.href = `#/${section.id}/${next.slug}`; a.appendChild(el("span", "pn-dir", "次 →")); a.appendChild(el("span", "pn-title", next.title)); nav.appendChild(a); }
  contentEl.appendChild(nav);
}

/* ---------- トレンド ---------- */
function renderIssueItems(host, issue) {
  for (const item of issue.items) {
    const c = el("article", "card");
    c.appendChild(chip(item.category));
    c.appendChild(el("h3", null, item.title));
    c.appendChild(pRich(null, item.summary));
    const w = el("div", "why");
    w.appendChild(el("b", null, "なぜ重要か"));
    w.appendChild(richText(item.why));
    c.appendChild(w);
    if (item.source) {
      const a = el("a", "src", item.source);
      a.href = item.source; a.target = "_blank"; a.rel = "noopener";
      c.appendChild(a);
    }
    host.appendChild(c);
  }
}

async function renderTrends(sub) {
  const data = await loadJSON("content/trends.json");
  const fu = document.getElementById("footer-updated");
  if (fu) fu.textContent = `LAST RECEIVED: ${data.updated || "—"}`;

  if (sub === "archive") {
    breadcrumb(contentEl, [["トレンド", "#/trends"], ["アーカイブ", null]]);
    header(contentEl, "アーカイブ", "これまでの全号。新しい順に並んでいます。");
    const grid = el("div", "card-grid");
    for (const issue of data.issues) {
      grid.appendChild(cardLink(`#/trends/${issue.version}`, issue.headline, `${issue.date} ・ 記事${issue.items.length}本`, issue.version));
    }
    contentEl.appendChild(grid);
    return;
  }
  if (sub) {
    const issue = data.issues.find(i => i.version === sub);
    if (!issue) return renderNotFound();
    breadcrumb(contentEl, [["トレンド", "#/trends"], ["アーカイブ", "#/trends/archive"], [issue.version, null]]);
    header(contentEl, issue.headline, issue.date, issue.version);
    renderIssueItems(contentEl, issue);
    return;
  }
  const latest = data.issues[0];
  const section = SITE.sections.find(s => s.id === "trends");
  header(contentEl, "トレンド", section.lede, data.updated);
  contentEl.appendChild(el("h2", "issue-head", latest.headline));
  contentEl.appendChild(el("p", "issue-date", `${latest.version} ・ ${latest.date}`));
  renderIssueItems(contentEl, latest);
  if (data.issues.length > 1) {
    const grid = el("div", "card-grid");
    grid.appendChild(cardLink("#/trends/archive", "過去の号をすべて見る", `アーカイブに${data.issues.length - 1}号あります`, "ARCHIVE"));
    contentEl.appendChild(grid);
  }
}

/* ---------- 用語辞典 ---------- */
async function renderGlossary(slug) {
  const data = await loadJSON("content/glossary.json");
  if (slug) {
    const t = data.terms.find(x => x.slug === slug);
    if (!t) return renderNotFound();
    breadcrumb(contentEl, [["用語辞典", "#/glossary"], [t.term, null]]);
    header(contentEl, t.term, null, null);
    const c = el("article", "card");
    c.appendChild(chip(t.category));
    if (t.reading) c.appendChild(el("p", "term-reading", t.reading));
    c.appendChild(pRich(null, t.definition));
    if (t.context) {
      const ctx = el("p", "term-context");
      ctx.appendChild(el("b", null, "文脈 "));
      ctx.appendChild(richText(t.context));
      c.appendChild(ctx);
    }
    contentEl.appendChild(c);
    if (t.related && t.related.length) {
      const grid = el("div", "card-grid");
      for (const r of t.related) {
        const rt = data.terms.find(x => x.slug === r);
        if (rt) grid.appendChild(cardLink(`#/glossary/${rt.slug}`, rt.term, rt.definition.slice(0, 42) + "…", rt.category));
      }
      const sec = el("div", "next-steps");
      sec.appendChild(el("h2", "doc-h2", "関連する用語"));
      sec.appendChild(grid);
      contentEl.appendChild(sec);
    }
    return;
  }
  const section = SITE.sections.find(s => s.id === "glossary");
  header(contentEl, "用語辞典", section.lede, data.updated);
  const box = el("input", "search-box");
  box.type = "search";
  box.placeholder = `用語を絞り込み(全${data.terms.length}語)`;
  contentEl.appendChild(box);
  const list = el("div");
  contentEl.appendChild(list);
  const render = (q) => {
    list.innerHTML = "";
    const query = (q || "").toLowerCase();
    const hits = data.terms.filter(t =>
      !query || t.term.toLowerCase().includes(query) || (t.reading || "").includes(query) ||
      stripLinks(t.definition).includes(q) || t.category.includes(q));
    if (!hits.length) { list.appendChild(el("p", "no-hit", "該当する用語がありません。")); return; }
    const grid = el("div", "card-grid");
    for (const t of hits) grid.appendChild(cardLink(`#/glossary/${t.slug}`, t.term, stripLinks(t.definition).slice(0, 60) + "…", t.category));
    list.appendChild(grid);
  };
  box.addEventListener("input", () => render(box.value));
  render("");
}

/* ---------- サイト内検索 ---------- */
let SEARCH_INDEX = null;
async function buildSearchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const idx = [];
  for (const s of SITE.sections) {
    if (s.type === "docs") {
      for (const p of s.pages) {
        try {
          const d = await loadJSON(`content/pages/${s.id}/${p.slug}.json`);
          const text = d.blocks.map(b => stripLinks([b.text, b.body, ...(b.items || [])].filter(Boolean).join(" "))).join(" ");
          idx.push({ href: `#/${s.id}/${p.slug}`, section: s.label, title: d.title, summary: p.summary, text: (d.lede + " " + text).toLowerCase(), raw: d.lede + " " + text });
        } catch (e) { /* ページ未作成はスキップ */ }
      }
    }
  }
  const g = await loadJSON("content/glossary.json");
  for (const t of g.terms) {
    idx.push({ href: `#/glossary/${t.slug}`, section: "用語辞典", title: t.term, summary: stripLinks(t.definition).slice(0, 60), text: (t.term + " " + (t.reading || "") + " " + stripLinks(t.definition + " " + (t.context || ""))).toLowerCase(), raw: stripLinks(t.definition) });
  }
  const tr = await loadJSON("content/trends.json");
  for (const issue of tr.issues) {
    for (const item of issue.items) {
      idx.push({ href: `#/trends/${issue.version}`, section: `トレンド ${issue.version}`, title: item.title, summary: stripLinks(item.summary).slice(0, 60), text: (item.title + " " + item.summary + " " + item.why + " " + item.category).toLowerCase(), raw: item.summary });
    }
  }
  SEARCH_INDEX = idx;
  return idx;
}

async function renderSearch() {
  header(contentEl, "サイト内検索", "全ページ・全用語・全号を横断検索します。");
  const box = el("input", "search-box");
  box.type = "search";
  box.placeholder = "検索語(例: temperature、エージェント、RAG)";
  contentEl.appendChild(box);
  const hint = el("p", "loading", "索引を準備しています…");
  contentEl.appendChild(hint);
  const list = el("div");
  contentEl.appendChild(list);
  const idx = await buildSearchIndex();
  hint.remove();
  const render = (q) => {
    list.innerHTML = "";
    const query = (q || "").trim().toLowerCase();
    if (!query) return;
    const hits = idx
      .map(e => {
        let score = 0;
        if (e.title.toLowerCase().includes(query)) score += 10;
        if (e.text.includes(query)) score += 1;
        return { e, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    if (!hits.length) { list.appendChild(el("p", "no-hit", `「${q}」に一致する内容が見つかりませんでした。`)); return; }
    const grid = el("div", "card-grid");
    for (const { e } of hits) grid.appendChild(cardLink(e.href, e.title, e.summary, e.section));
    list.appendChild(grid);
  };
  box.addEventListener("input", () => render(box.value));
  box.focus();
}

function renderNotFound() {
  header(contentEl, "ページが見つかりません", "URLが変わった可能性があります。上のタブから辿り直してください。");
}

/* ---------- tab bar ---------- */
function buildTabs() {
  tabScroll.innerHTML = "";
  for (const s of SITE.sections) {
    const b = el("button", "tab", s.label);
    b.id = "tab-" + s.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", "false");
    b.addEventListener("click", () => { location.hash = "#/" + s.id; });
    tabScroll.appendChild(b);
  }
}

/* ---------- routing ---------- */
async function route() {
  if (!SITE) { SITE = await loadJSON("content/site.json"); buildTabs(); }
  const raw = location.hash.replace(/^#\/?/, "");
  const [head, ...rest] = raw.split("/").filter(Boolean);
  const sectionId = head || "trends";
  const sub = rest.join("/");

  for (const s of SITE.sections) {
    const b = document.getElementById("tab-" + s.id);
    if (!b) continue;
    b.setAttribute("aria-selected", String(s.id === sectionId));
    if (s.id === sectionId) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  contentEl.innerHTML = "";
  contentEl.appendChild(el("p", "loading", "受信しています…"));
  try {
    const section = SITE.sections.find(s => s.id === sectionId);
    contentEl.innerHTML = "";
    if (sectionId === "search") await renderSearch();
    else if (sectionId === "trends") await renderTrends(sub);
    else if (sectionId === "glossary") await renderGlossary(sub);
    else if (section && section.type === "docs") {
      if (sub) await renderArticle(section, sub);
      else renderLanding(section);
    } else renderNotFound();
    window.scrollTo({ top: 0 });
  } catch (e) {
    contentEl.innerHTML = "";
    contentEl.appendChild(el("p", "loading", "コンテンツを受信できませんでした。オフラインの場合は、一度オンラインで開くと以後オフラインでも読めます。"));
  }
}
addEventListener("hashchange", route);

/* 検索ボタンと "/" ショートカット */
const searchBtn = document.getElementById("search-btn");
if (searchBtn) searchBtn.addEventListener("click", () => { location.hash = "#/search"; });
addEventListener("keydown", (e) => {
  if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
    e.preventDefault();
    location.hash = "#/search";
  }
});

/* ---------- boot ---------- */
route();
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
