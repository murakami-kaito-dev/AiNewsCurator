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
    <p class="demo-title">DEMO 01 — 次のトークンを予測する</p>
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
    <p class="demo-title">DEMO 02 — 自己注意:単語は文中の他の単語を「見て」意味を決める</p>
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

/* ---------- 3. 学習パイプライン ---------- */
window.DEMOS["training"] = function (frame) {
  const stages = [
    ["事前学習", "Web規模のテキストで「次のトークン予測」をひたすら学ぶ。知識と言語能力の土台。"],
    ["SFT", "人間が書いた模範解答で微調整。「指示に従う」振る舞いを学ぶ。"],
    ["RLHF / RLAIF", "回答を比較評価した報酬で強化学習。「好ましい答え方」に寄せる。"],
    ["推論(あなたが使う時)", "重みは固定。文脈を入力に、次トークン予測を高速に繰り返すだけ。"],
  ];
  frame.insertAdjacentHTML("beforeend", `
    <p class="demo-title">DEMO 03 — LLMができるまで</p>
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
