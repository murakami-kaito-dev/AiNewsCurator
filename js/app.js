/* ANTENNA app shell
 * コンテンツは content/*.json から読む。定期更新ではJSONだけを触り、このファイルは原則触らない。
 * JSONスキーマを変える場合は対応するrendererと同時に変えること(CLAUDE.md 不変条件)。
 */
"use strict";

const TABS = [
  { id: "trends",         label: "今週のトレンド" },
  { id: "history",        label: "AIの歴史" },
  { id: "glossary",       label: "用語辞典" },
  { id: "mechanism",      label: "LLMのしくみ" },
  { id: "in-practice",    label: "現場での活用" },
  { id: "capability-map", label: "できる/できない" },
  { id: "radar",          label: "次に来るもの" },
  { id: "roadmap",        label: "学習ロードマップ" },
];

const contentEl = document.getElementById("content");
const tabScroll = document.getElementById("tab-scroll");
const cache = {};

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
  const span = document.createElement("span");
  host.appendChild(span);
  let i = Math.floor(STREAM_WORDS.length / 2);
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
function whyBlock(text) {
  const d = el("div", "why");
  d.appendChild(el("b", null, "なぜ重要か"));
  d.appendChild(document.createTextNode(text));
  return d;
}
function chip(text) { return el("span", "chip", text); }

/* ---------- tab bar ---------- */
for (const t of TABS) {
  const b = el("button", "tab", t.label);
  b.id = "tab-" + t.id;
  b.setAttribute("role", "tab");
  b.setAttribute("aria-selected", "false");
  b.addEventListener("click", () => { location.hash = t.id; });
  tabScroll.appendChild(b);
}

/* ---------- routing ---------- */
async function route() {
  const id = location.hash.replace("#", "") || "trends";
  const tab = TABS.find(t => t.id === id) || TABS[0];
  for (const t of TABS) {
    const b = document.getElementById("tab-" + t.id);
    b.setAttribute("aria-selected", String(t.id === tab.id));
    if (t.id === tab.id) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }
  contentEl.innerHTML = "";
  contentEl.appendChild(el("p", "loading", "受信しています…"));
  try {
    if (!cache[tab.id]) {
      const res = await fetch(`content/${tab.id}.json`);
      if (!res.ok) throw new Error(`${res.status}`);
      cache[tab.id] = await res.json();
    }
    contentEl.innerHTML = "";
    RENDERERS[tab.id](cache[tab.id], contentEl);
    window.scrollTo({ top: 0 });
  } catch (e) {
    contentEl.innerHTML = "";
    const p = el("p", "loading", "コンテンツを受信できませんでした。オフラインの場合は、一度オンラインで開くと以後オフラインでも読めます。");
    contentEl.appendChild(p);
  }
}
addEventListener("hashchange", route);

/* ---------- renderers ---------- */
function header(host, title, lede, updated) {
  if (updated) host.appendChild(el("p", "updated-line", `LAST RECEIVED: ${updated}`));
  host.appendChild(el("h1", "tab-title", title));
  if (lede) host.appendChild(el("p", "tab-lede", lede));
}

const RENDERERS = {
  trends(data, host) {
    header(host, "今週のトレンド", "この2週間で受信した、知っておくべき動き。", data.updated);
    document.getElementById("footer-updated").textContent = `LAST RECEIVED: ${data.updated || "—"}`;
    for (const issue of data.issues) {
      const h = el("h2", "issue-head", issue.headline);
      host.appendChild(h);
      host.appendChild(el("p", "issue-date", `${issue.version} ・ ${issue.date}`));
      for (const item of issue.items) {
        const c = el("article", "card");
        c.appendChild(chip(item.category));
        c.appendChild(el("h3", null, item.title));
        c.appendChild(el("p", null, item.summary));
        c.appendChild(whyBlock(item.why));
        if (item.source) {
          const a = el("a", "src", item.source);
          a.href = item.source; a.target = "_blank"; a.rel = "noopener";
          c.appendChild(a);
        }
        host.appendChild(c);
      }
    }
  },

  history(data, host) {
    header(host, "AIの歴史", "70年の流れを掴めば、今日のニュースの位置づけがわかる。", data.updated);
    for (const era of data.eras) {
      const sec = el("section", "era");
      sec.appendChild(el("h2", "era-title", era.title));
      sec.appendChild(el("p", "era-period", era.period));
      const tl = el("div", "timeline");
      for (const ev of era.events) {
        const e = el("div", "tl-event");
        e.appendChild(el("div", "tl-year", String(ev.year)));
        e.appendChild(el("div", "tl-title", ev.title));
        e.appendChild(el("div", "tl-body", ev.body));
        tl.appendChild(e);
      }
      sec.appendChild(tl);
      host.appendChild(sec);
    }
  },

  glossary(data, host) {
    header(host, "用語・概念辞典", "言葉には「いつ・なぜ流行ったか」という文脈がある。", data.updated);
    const box = el("input", "search-box");
    box.type = "search";
    box.placeholder = "用語を検索(例: MCP、エージェント)";
    host.appendChild(box);
    const list = el("div");
    host.appendChild(list);
    const render = (q) => {
      list.innerHTML = "";
      const query = (q || "").toLowerCase();
      const hits = data.terms.filter(t =>
        !query ||
        t.term.toLowerCase().includes(query) ||
        (t.reading || "").includes(query) ||
        t.definition.includes(q) ||
        t.category.includes(q)
      );
      if (!hits.length) { list.appendChild(el("p", "no-hit", "該当する用語がありません。次回の受信で追加されるかもしれません。")); return; }
      for (const t of hits) {
        const c = el("article", "card");
        const head = el("div", "term-head");
        head.appendChild(el("h3", null, t.term));
        head.appendChild(chip(t.category));
        c.appendChild(head);
        c.appendChild(el("p", null, t.definition));
        if (t.context) {
          const ctx = el("p", "term-context");
          ctx.appendChild(el("b", null, "文脈 "));
          ctx.appendChild(document.createTextNode(t.context));
          c.appendChild(ctx);
        }
        if (t.related && t.related.length) c.appendChild(el("p", "term-related", "関連: " + t.related.join(" / ")));
        list.appendChild(c);
      }
    };
    box.addEventListener("input", () => render(box.value));
    render("");
  },

  mechanism(data, host) {
    header(host, "LLMのしくみ", "魔法ではなく、確率と行列の積み重ね。動かして理解する。", data.updated);
    for (const s of data.sections) {
      const sec = el("section", "mech-section");
      sec.appendChild(el("h2", null, s.title));
      for (const para of s.body) sec.appendChild(el("p", null, para));
      if (s.demo && window.DEMOS && window.DEMOS[s.demo]) {
        const frame = el("div", "demo-frame");
        window.DEMOS[s.demo](frame);
        sec.appendChild(frame);
      }
      if (s.points && s.points.length) {
        const ul = el("ul", "mech-points");
        for (const p of s.points) ul.appendChild(el("li", null, p));
        sec.appendChild(ul);
      }
      host.appendChild(sec);
    }
  },

  "in-practice"(data, host) {
    header(host, "現場での活用", "AIは今、実務のどこに入り込んでいるか。", data.updated);
    for (const c of data.cases) {
      const card = el("article", "card");
      card.appendChild(chip(c.area));
      card.appendChild(el("h3", null, c.title));
      card.appendChild(el("p", null, c.body));
      if (c.tools && c.tools.length) card.appendChild(el("p", "term-related", "代表的ツール: " + c.tools.join(" / ")));
      host.appendChild(card);
    }
  },

  "capability-map"(data, host) {
    header(host, "できること / できないこと", "能力の境界線は毎月動く。「⇢ 移動」は前回から境界を越えた項目。", data.updated);
    const grid = el("div", "cap-grid");
    const mk = (cls, title, items, showMoved) => {
      const col = el("div", "cap-col " + cls);
      col.appendChild(el("h2", null, title));
      for (const it of items) {
        const d = el("div", "cap-item");
        const h = el("h3", null, it.title);
        if (showMoved && it.moved) h.appendChild(el("span", "moved", "⇢ 移動 " + it.moved));
        d.appendChild(h);
        d.appendChild(el("p", null, it.note));
        col.appendChild(d);
      }
      return col;
    };
    grid.appendChild(mk("can", "できる", data.can, true));
    grid.appendChild(mk("cannot", "まだできない・苦手", data.cannot, false));
    host.appendChild(grid);
  },

  radar(data, host) {
    header(host, "次に来るもの", "まだ主流ではない。だが観測は始まっている。", data.updated);
    for (const st of data.stages) {
      const sec = el("section", "radar-stage");
      sec.appendChild(el("h2", null, st.label));
      if (st.desc) sec.appendChild(el("p", "stage-desc", st.desc));
      for (const it of st.items) {
        const c = el("article", "card");
        c.appendChild(el("h3", null, it.name));
        c.appendChild(el("p", null, it.desc));
        c.appendChild(whyBlock(it.why));
        sec.appendChild(c);
      }
      host.appendChild(sec);
    }
  },

  roadmap(data, host) {
    header(host, "学習ロードマップ", "どの順で理解するかで、かかる時間は大きく変わる。", data.updated);
    data.steps.forEach((s, idx) => {
      const step = el("div", "step");
      const rail = el("div", "step-rail");
      rail.appendChild(el("div", "step-no", String(idx + 1)));
      rail.appendChild(el("div", "rail"));
      step.appendChild(rail);
      const body = el("div", "step-body");
      body.appendChild(el("h2", null, s.title));
      body.appendChild(el("p", "step-goal", "ゴール: " + s.goal));
      for (const it of s.items) {
        const d = el("div", "step-item");
        d.appendChild(el("h3", null, it.name));
        d.appendChild(el("p", null, it.desc));
        body.appendChild(d);
      }
      step.appendChild(body);
      host.appendChild(step);
    });
  },
};

/* ---------- boot ---------- */
route();
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
