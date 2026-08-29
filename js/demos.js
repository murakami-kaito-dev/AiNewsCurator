/* ANTENNA — LLMのしくみ タブの図解アニメーション。
 * content/mechanism.json の "demo" キーがここの関数名を指す。
 * 関数名を変えたらJSONも同時に変えること(CLAUDE.md 不変条件)。
 */
"use strict";

window.DEMOS = {};
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. 次トークン予測 ---------- */
window.DEMOS["next-token"] = function (frame) {
  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO 01 — 次のトークンを予測する</p>
    <p class="nt-sentence"><span class="cursor">▍</span></p>
    <div class="nt-cands"></div>
    <button class="demo-btn">生成してみる</button>
    <p class="demo-hint">LLMがやっているのは本質的にこれだけ。「次に来る確率が高い語」を1つずつ選び続けている。</p>
  `);
  const sentenceEl = frame.querySelector(".nt-sentence");
  const candsEl = frame.querySelector(".nt-cands");
  const btn = frame.querySelector(".demo-btn");

  // 各ステップ: 確定済み文脈に対する候補と確率(演出用の擬似値)
  const STEPS = [
    { cands: [["AI", 42], ["天気", 23], ["猫", 18], ["量子", 9]], pick: 0 },
    { cands: [["は", 61], ["が", 22], ["と", 8], ["を", 5]], pick: 0 },
    { cands: [["次の", 38], ["人間の", 25], ["未来", 17], ["単なる", 12]], pick: 0 },
    { cands: [["トークン", 47], ["時代", 21], ["質問", 14], ["休日", 4]], pick: 0 },
    { cands: [["を", 66], ["に", 15], ["から", 9], ["まで", 3]], pick: 0 },
    { cands: [["予測", 52], ["生成", 28], ["削除", 6], ["料理", 2]], pick: 0 },
    { cands: [["している", 58], ["できない", 17], ["したい", 12], ["される", 7]], pick: 0 },
  ];

  function renderCands(step) {
    candsEl.innerHTML = "";
    for (let i = 0; i < step.cands.length; i++) {
      const [word, p] = step.cands[i];
      const row = document.createElement("div");
      row.className = "nt-cand" + (i === step.pick ? " win" : "");
      row.innerHTML = `<span class="lbl">${word}</span><span class="bar-track"><span class="bar"></span></span><span class="pct">${p}%</span>`;
      candsEl.appendChild(row);
      requestAnimationFrame(() => { row.querySelector(".bar").style.width = p + "%"; });
    }
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    sentenceEl.innerHTML = '<span class="cursor">▍</span>';
    for (const step of STEPS) {
      renderCands(step);
      await new Promise(r => setTimeout(r, REDUCED ? 60 : 950));
      const tok = document.createElement("span");
      tok.className = "tok";
      tok.textContent = step.cands[step.pick][0];
      sentenceEl.insertBefore(tok, sentenceEl.querySelector(".cursor"));
      await new Promise(r => setTimeout(r, REDUCED ? 30 : 350));
    }
    candsEl.innerHTML = "";
    btn.disabled = false;
    btn.textContent = "もう一度";
  });
};

/* ---------- 2. 自己注意(Self-Attention) ---------- */
window.DEMOS["attention"] = function (frame) {
  const tokens = ["彼", "は", "銀行", "の", "口座", "を", "開いた"];
  // tokens[i] が各トークンにどれだけ注意を向けるか(演出用の擬似値・行ごとに正規化済みイメージ)
  const W = [
    [0.55, 0.05, 0.05, 0.02, 0.15, 0.03, 0.15],
    [0.30, 0.30, 0.10, 0.05, 0.10, 0.05, 0.10],
    [0.05, 0.02, 0.40, 0.03, 0.35, 0.03, 0.12],
    [0.05, 0.05, 0.40, 0.25, 0.15, 0.05, 0.05],
    [0.08, 0.02, 0.45, 0.05, 0.30, 0.02, 0.08],
    [0.05, 0.05, 0.10, 0.05, 0.35, 0.20, 0.20],
    [0.10, 0.03, 0.30, 0.02, 0.30, 0.05, 0.20],
  ];
  const Wd = 340, H = 120, y0 = 30, y1 = 100;
  const xs = tokens.map((_, i) => 30 + i * (Wd - 60) / (tokens.length - 1));

  let svg = `<svg class="attn-svg" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="自己注意の可視化">`;
  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < tokens.length; j++) {
      svg += `<path data-from="${i}" data-to="${j}" d="M ${xs[i]} ${y0 + 8} C ${xs[i]} 65, ${xs[j]} 65, ${xs[j]} ${y1 - 16}" opacity="0" stroke-width="1"/>`;
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    svg += `<text data-i="${i}" x="${xs[i]}" y="${y0}" text-anchor="middle">${tokens[i]}</text>`;
    svg += `<text data-b="${i}" x="${xs[i]}" y="${y1}" text-anchor="middle" opacity="0.35">${tokens[i]}</text>`;
  }
  svg += `</svg>`;

  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO 02 — 自己注意:単語は文中の他の単語を「見て」意味を決める</p>
    ${svg}
    <p class="demo-hint">上の行の単語をタップ。「口座」は「銀行」に強く注意を向ける — だから「川の土手(bank)」ではなく金融機関だと分かる。線の太さ=注意の強さ。</p>
  `);

  const svgEl = frame.querySelector("svg");
  function select(i) {
    svgEl.querySelectorAll("text[data-i]").forEach(t => t.classList.toggle("sel", +t.dataset.i === i));
    svgEl.querySelectorAll("path").forEach(p => {
      const from = +p.dataset.from, to = +p.dataset.to;
      if (from === i) {
        p.style.opacity = Math.max(0.08, W[i][to]);
        p.style.strokeWidth = (0.5 + W[i][to] * 6).toFixed(1);
      } else {
        p.style.opacity = 0;
      }
    });
  }
  svgEl.addEventListener("click", (e) => {
    const t = e.target.closest("text[data-i]");
    if (t) select(+t.dataset.i);
  });
  select(4); // 初期状態:「口座」
};

/* ---------- 4. トークン分割 ---------- */
window.DEMOS["tokenize"] = function (frame) {
  const SAMPLES = {
    "日本語": ["今日", "は", "いい", "天気", "です", "ね", "。", "散歩", "に", "行き", "ましょう", "。"],
    "English": ["The", " quick", " brown", " fox", " jumps", " over", " the", " lazy", " dog", "."],
    "コード": ["def", " hello", "():", "\\n", "    ", "print", "(", "\"", "こんにちは", "\"", ")"],
  };
  const PALETTE_ALPHA = [0.22, 0.14, 0.30];
  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO — 文章はどう「トークン」に刻まれるか</p>
    <div class="demo-tabs"></div>
    <div class="tok-row"></div>
    <p class="tok-meta"></p>
    <p class="demo-hint">同じ長さの文章でも、日本語は英語よりトークン数が多くなりがち。AIの料金も「読める量」も、文字数ではなくこのトークン数で数えられています。</p>
  `);
  const tabsEl = frame.querySelector(".demo-tabs");
  const rowEl = frame.querySelector(".tok-row");
  const metaEl = frame.querySelector(".tok-meta");
  function show(name) {
    tabsEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.textContent === name)));
    rowEl.innerHTML = "";
    const toks = SAMPLES[name];
    toks.forEach((t, i) => {
      const box = document.createElement("span");
      box.className = "tok-box";
      box.textContent = t.replace(/ /g, "␣").replace(/\\n/g, "⏎");
      box.style.background = `color-mix(in srgb, var(--wave) ${PALETTE_ALPHA[i % 3] * 100}%, transparent)`;
      box.style.animationDelay = REDUCED ? "0s" : (i * 0.06) + "s";
      rowEl.appendChild(box);
    });
    const chars = toks.join("").replace(/\\n/g, " ").length;
    metaEl.innerHTML = `文字数 ${chars} → <b>トークン数 ${toks.length}</b>(1トークン ≒ 日本語1〜2文字、英語は単語の断片)`;
  }
  for (const name of Object.keys(SAMPLES)) {
    const b = document.createElement("button");
    b.className = "demo-tab";
    b.textContent = name;
    b.addEventListener("click", () => show(name));
    tabsEl.appendChild(b);
  }
  show("日本語");
};

/* ---------- 5. temperature ---------- */
window.DEMOS["temperature"] = function (frame) {
  const CANDS = [["予測", 3.0], ["生成", 2.2], ["理解", 1.4], ["料理", 0.4], ["削除", 0.2]];
  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO — temperature:「かたい答え」と「意外な答え」のつまみ</p>
    <p class="doc-p" style="font-size:13.5px">文脈「AIは次の単語を___」に続く候補の選ばれやすさが、temperatureでどう変わるかを見てみます。</p>
    <div class="temp-slider-row">
      <span class="temp-value"></span>
      <input type="range" min="10" max="200" value="100" step="5" aria-label="temperature">
    </div>
    <div class="nt-cands"></div>
    <button class="demo-btn">この設定で10回選ばせる</button>
    <p class="temp-out"></p>
    <p class="demo-hint">低いと最有力ばかり選ぶ「かたい」出力に、高いと下位候補も選ばれる「ゆらぐ」出力になります。同じ質問でも答えが変わるのはこのランダム性のためです。</p>
  `);
  const slider = frame.querySelector("input");
  const valEl = frame.querySelector(".temp-value");
  const candsEl = frame.querySelector(".nt-cands");
  const btn = frame.querySelector(".demo-btn");
  const outEl = frame.querySelector(".temp-out");

  function probs(T) {
    const exps = CANDS.map(([, s]) => Math.exp(s / T));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }
  function render() {
    const T = slider.value / 100;
    valEl.textContent = "T = " + T.toFixed(2);
    const p = probs(T);
    candsEl.innerHTML = "";
    CANDS.forEach(([word], i) => {
      const row = document.createElement("div");
      row.className = "nt-cand" + (i === 0 ? " win" : "");
      const pct = Math.round(p[i] * 100);
      row.innerHTML = `<span class="lbl">${word}</span><span class="bar-track"><span class="bar" style="width:${pct}%"></span></span><span class="pct">${pct}%</span>`;
      candsEl.appendChild(row);
    });
  }
  slider.addEventListener("input", render);
  btn.addEventListener("click", () => {
    const p = probs(slider.value / 100);
    outEl.innerHTML = "選ばれた10回: ";
    for (let n = 0; n < 10; n++) {
      let r = Math.random(), i = 0;
      while (r > p[i] && i < p.length - 1) { r -= p[i]; i++; }
      const s = document.createElement("span");
      s.className = "tok";
      s.textContent = CANDS[i][0];
      s.style.animationDelay = REDUCED ? "0s" : (n * 0.08) + "s";
      outEl.appendChild(s);
    }
  });
  render();
};

/* ---------- 3. 学習パイプライン ---------- */
window.DEMOS["training"] = function (frame) {
  const stages = [
    ["事前学習", "Web規模のテキストで「次のトークン予測」をひたすら学ぶ。知識と言語能力の土台。"],
    ["SFT", "人間が書いた模範解答で微調整。「指示に従う」振る舞いを学ぶ。"],
    ["RLHF / RLAIF", "回答を比較評価した報酬で強化学習。「好ましい答え方」に寄せる。"],
    ["推論(あなたが使う時)", "重みは固定。文脈を入力に、次トークン予測を高速に繰り返すだけ。"],
  ];
  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO 03 — LLMができるまで</p>
    <div class="pipe">${stages.map((s, i) => `
      <div class="pipe-stage" data-i="${i}">
        <span class="stage-no">STAGE ${i + 1}</span>
        <h4>${s[0]}</h4>
        <p>${s[1]}</p>
      </div>`).join("")}
    </div>
    <p class="demo-hint">「学習」は工場での製造、「推論」は出荷後の稼働。ChatGPTに話しかけても、その場でモデルが賢くなっているわけではない。</p>
  `);
  const els = frame.querySelectorAll(".pipe-stage");
  let cur = 0;
  els[0].classList.add("active");
  if (!REDUCED) {
    setInterval(() => {
      els[cur].classList.remove("active");
      cur = (cur + 1) % els.length;
      els[cur].classList.add("active");
    }, 2200);
  }
};

/* ---------- 6. パラメータ = 重み(線)の本数 ---------- */
window.DEMOS["neural-params"] = function (frame) {
  const IN = 3, OUT = 2;
  const SIZES = [2, 4, 8];
  let hidden = 4;

  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">体験デモ DEMO — パラメータは「線の本数」で数える</p>
    <p class="nn-legend">丸=ニューロン(信号を受け取って次へ渡す計算の単位) / 線=重み。線1本が<b>パラメータ1個</b>です。</p>
    <div class="demo-tabs"></div>
    <div class="nn-wrap"></div>
    <p class="nn-count"></p>
    <p class="nn-pick"></p>
    <p class="demo-hint">線をタップすると1本(=パラメータ1個)が光ります。中間層の丸を増やすと線が一気に増える — これが「パラメータ数が爆発する」ということ。実際のLLMは、この図の何億倍もの線を持っています。</p>
  `);

  const tabsEl = frame.querySelector(".demo-tabs");
  const wrapEl = frame.querySelector(".nn-wrap");
  const countEl = frame.querySelector(".nn-count");
  const pickEl = frame.querySelector(".nn-pick");

  function ys(n, h) {
    const step = h / (n + 1);
    return Array.from({ length: n }, (_, i) => Math.round(step * (i + 1)));
  }

  function draw() {
    const W = 330, H = 190;
    const xs = [45, 165, 285];
    const layers = [ys(IN, H), ys(hidden, H), ys(OUT, H)];
    let svg = `<svg class="nn-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="ニューラルネットワークの重みの図">`;
    for (let l = 0; l < 2; l++) {
      layers[l].forEach((y1) => {
        layers[l + 1].forEach((y2) => {
          svg += `<line class="nn-line" x1="${xs[l]}" y1="${y1}" x2="${xs[l + 1]}" y2="${y2}" />`;
        });
      });
    }
    layers.forEach((col, l) => {
      col.forEach((y) => {
        svg += `<circle class="nn-node nn-node-${l}" cx="${xs[l]}" cy="${y}" r="9" />`;
      });
    });
    svg += `<text class="nn-cap" x="${xs[0]}" y="${H - 2}" text-anchor="middle">入力</text>`;
    svg += `<text class="nn-cap" x="${xs[1]}" y="${H - 2}" text-anchor="middle">中間</text>`;
    svg += `<text class="nn-cap" x="${xs[2]}" y="${H - 2}" text-anchor="middle">出力</text>`;
    svg += `</svg>`;
    wrapEl.innerHTML = svg;

    wrapEl.querySelectorAll(".nn-line").forEach((ln) => {
      ln.addEventListener("click", () => {
        wrapEl.querySelectorAll(".nn-line").forEach((o) => o.classList.remove("on"));
        ln.classList.add("on");
        pickEl.textContent = "↑ いま光っている線1本が、調整される数値(重み)1個 = パラメータ1個です。";
      });
    });

    const w1 = IN * hidden, w2 = hidden * OUT;
    const weights = w1 + w2;
    const biases = hidden + OUT;
    countEl.innerHTML =
      `線(重み) ${IN}×${hidden} + ${hidden}×${OUT} = <b>${weights}本</b>` +
      ` / 丸ごとの調整値(バイアス) ${biases}個 → <b>合計 ${weights + biases} パラメータ</b>`;
    pickEl.textContent = "";
  }

  SIZES.forEach((n) => {
    const b = document.createElement("button");
    b.className = "demo-tab";
    b.textContent = "中間層 " + n + "個";
    b.addEventListener("click", () => {
      hidden = n;
      tabsEl.querySelectorAll("button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)));
      draw();
    });
    tabsEl.appendChild(b);
  });
  tabsEl.querySelectorAll("button")[1].setAttribute("aria-pressed", "true");
  draw();
};
