# コンテンツ様式ガイド(執筆者向け・恒久)

ANTENNAの全コンテンツはこのガイドに従う。定期更新エージェントも新規ページ執筆時はここが正。

## 読者定義 —「オカン基準」

読者は「技術に疎い人でも読み切れば理解できる」ことを基準にする(通称オカン基準)。
実際の主読者はエンジニアだが、**説明の丁寧さはオカン基準、補足の深さはエンジニア基準**の二層構造にする。

## 専門用語の全数ルール(最重要)

- ページ内に登場する専門性の高い用語は、**例外なく** (a) その場で一言説明する、
  (b) `[[glossary:slug|表示名]]` で用語辞典へリンクする、のどちらか(併用推奨)。
- そのページの主題から外れる長い説明は本文に書かず、リンク先に逃がす(本筋の脱線防止)。
- リンクに使ってよいslugは本ガイド末尾の「用語slug一覧」にあるものだけ。
  一覧にない用語を使いたければ、まず glossary.json に追加してから使う。

## ページの型

順序は原則: リード文 → 例え話 → 本文(易→難) → エンジニア向け補足 → 次のステップ。

- **リード文(lede)**: このページで何が分かるかを2文で。
- **例え話(analogyブロック)**: 冒頭に必ず1つ。日常の物事に例えて直感を作る。
- **本文**: h2で3〜5節に分ける。1段落は3〜4文まで。「なぜ?」に必ず答える
  (例:「GPUと相性が良い」→ なぜ相性が良いのかまで書く)。
- **エンジニア向け補足(calloutブロック)**: 実務者向けの一歩深い話・数値・落とし穴。
- **次のステップ(linksブロック)**: 関連ページへ2〜4リンク。学習順で自然な次を先頭に。
- 分量: **上限なし(2026-08-24 にオーナー判断で字数制約を撤廃)。**
  短くするために説明を削らないこと。必要な説明は必要なだけ書いてよい。
  ただし**冗長さは別問題**であり、次は引き続き禁止:
  同じ主張の言い換えによる繰り返し / 図解に書いた内容の本文での再説明 / 意味を足さない修飾。
  また「手順・比較・分類は文章ではなく図解ブロック(flow/table/nested)にする」原則は維持する
  (これは短くするためではなく、その方が理解しやすいため)。

## 文体

- です・ます調。断定できることは断定する。
- 比喩は導入に使い、そのあと必ず正確な言い換えを添える(比喩で終わらせない)。
- ユーザーへの指示経緯・開発の経緯など、サイトの外の文脈を持ち込まない。
  これは本文だけでなく**見出し・ブロックのタイトル・リンクのラベル**も対象。
  読者は執筆の経緯を知らない。「この整理の出典」「今回の追加分」のように
  **書き手側の事情を指す言葉を、読者向けの名前として使わない**
  (正しくは「出典」「関連書籍」のように、読者から見て何であるかを書く)。
- 事実(日付・名称・数値)は確認済みのものだけ書く。不確かなら書かないか「未確認」と明記。
- **呼び方の出どころを示す。** 業界で使われている呼称・分類を紹介するときは、
  「英語圏の技術記事では〜と呼ばれます」のように**誰がそう呼んでいるか**が分かるように書き、
  可能なら `resources` ブロックで出典を並べる。
  読者に「筆者が勝手にそう呼んでいるのか、実際にそう呼ばれるのか」を迷わせないこと。
  逆に、このサイト独自の言い換えなら「このページでは〜と呼びます」と断る。

## ファイル配置とスキーマ

- ナビ構成: `content/site.json`(セクション→子ページの一覧。ここに載せたページは必ず実体を作る)
- ページ本体: `content/pages/<section>/<slug>.json`

```json
{
  "title": "ページタイトル",
  "lede": "リード文(2文)",
  "updated": "2026.08.23",
  "blocks": [
    { "type": "analogy", "body": "例え話。テキスト内で [[glossary:token|トークン]] リンク可。\\n\\n で段落を分けられる(長い例え話は1〜2文ごとに分ける)" },
    { "type": "h2", "text": "節タイトル" },
    { "type": "p", "text": "段落。[[glossary:slug|表示名]] と [[page:section/slug|表示名]] が使える" },
    { "type": "list", "items": ["項目1", "項目2"] },
    { "type": "table", "headers": ["列1", "列2"], "rows": [["a", "b"]] },
    { "type": "callout", "title": "エンジニア向け補足", "body": "一歩深い話" },
    { "type": "demo", "id": "attention" },
    { "type": "links", "items": [ { "to": "page:basics/attention", "label": "リンク名", "note": "一言" } ] }
  ]
}
```

- インラインリンク記法(すべてのテキストフィールドで有効):
  - `[[glossary:slug|表示名]]` → 用語辞典の該当語ページへ
  - `[[page:section/slug|表示名]]` → 記事ページへ
- **Markdown記法は使えない**(`**太字**`・`# 見出し`・`- 箇条書き` 等はそのまま文字として表示される)。
  強調は文構造で表す。箇条書きは `list` ブロック、見出しは `h2` ブロックを使う。リンクは上記の `[[...]]` のみ。
- demo の id は `next-token` / `attention` / `training` / `tokenize` / `temperature` / `neural-params` のみ。
- 図解ブロック: `nested`(入れ子/包含図。`layers:[{label,desc}]` を外側→内側で描画)、
  `flow`(処理フロー図。`rows:[{name,steps:[文字列 or {text,auto:true}],example}]`。`auto:true` のステップは強調表示)。
  ※`flow` の `steps` はリンク記法が展開されない。用語リンクを置くなら `example` 側に書くこと。
- **リンク記法が展開されない場所**(書くと `[[...]]` が画面にそのまま出る。validate.py が検出する):
  `h2` の見出し / ページの `title` / `flow` の `steps`。
  見出しに用語を出したい場合は**見出しはプレーンにし、直後の本文でリンクする**。

## 用語辞典のスキーマ (`content/glossary.json`)

```json
{ "updated": "2026.08.23", "terms": [ {
  "slug": "token", "term": "トークン", "reading": "とーくん", "category": "基礎",
  "definition": "オカン基準の定義(2〜4文。ここだけ読めば意味が分かる)",
  "context": "いつ・なぜ流行った/実務でどこに効く(1〜3文)",
  "related": ["context-window", "tokenizer"]
} ] }
```
category は 基礎 / アーキテクチャ / 技術 / 実践 / エージェント / モデル / 限界 / 安全性 / 規制・倫理 / 業界 / 萌芽 のいずれか。

## 用語slug一覧(リンク先として使ってよい語)

agi, ai, machine-learning, deep-learning, neural-network, weight, parameter, gpu,
llm, generative-ai, foundation-model, token, tokenizer, context-window,
transformer, attention, embedding, vector, next-token-prediction, temperature, sampling,
pretraining, sft, rlhf, reward-model, fine-tuning, inference, scaling-laws, emergence,
hallucination, grounding, multimodal, reasoning-model, benchmark,
prompt, prompt-engineering, system-prompt, few-shot, chain-of-thought, context-engineering,
api, api-key, rate-limit, sdk, open-weight, local-llm,
rag, vector-db, semantic-search, chunking,
agent, tool-use, mcp, mcp-server, a2a, orchestration, sub-agent,
harness-engineering, loop-engineering, framework, langchain,
alignment, ai-safety, prompt-injection, jailbreak, pii,
copyright-ai, eu-ai-act, ai-governance, deepfake,
g-kentei, e-shikaku, world-model, continual-learning, agent-memory, ai-ethics,
lost-in-the-middle, prompt-caching, idempotency,
stateless, session, harness, in-context-learning, verifier
