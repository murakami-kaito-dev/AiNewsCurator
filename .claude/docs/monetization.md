# マネタイズ運用メモ

ペイウォールなし方針。3本柱=①ニュースレター(読者を貯める箱)②寄付/応援 ③アフィリエイト。
実装は「Claudeが仕組みを作る/ユーザーが外部アカウントのID・URLを取得して渡す」の分担。

## ① ニュースレター登録(Cloudflare 自前・KV保存)

- 実装済み: 登録フォーム([js/app.js] `newsletterBox`)、受け口([worker/index.js] `POST /api/subscribe`)。
  メールは KV `SUBSCRIBERS` に保存(キー=メール、値=登録日時)。ハニーポットで簡易ボット対策済み。
- **表示フラグ**: `content/site.json` の `newsletter.enabled`。KV接続が済むまで `false`(フォーム非表示)。
- **ユーザーがやること(1回)**:
  1. Cloudflareダッシュボード → Workers & Pages → KV → **Create namespace**(名前例 `antenna-subscribers`)
  2. 作成された **Namespace ID** を Claude に渡す
- **その後Claudeがやること**: `wrangler.jsonc` に KV バインディングを追加、`site.json` の `newsletter.enabled` を `true` に → push。
  ```jsonc
  // wrangler.jsonc に追記する形(IDは実値に置換)
  "kv_namespaces": [{ "binding": "SUBSCRIBERS", "id": "<namespace-id>" }]
  ```
- 登録者の閲覧: CloudflareダッシュボードのKVビューアで一覧可能(value.status: pending=確認待ち / confirmed=配信対象)。
- **配信は実装済み(2026-08-27)**: ダブルオプトイン(確認メール)+解除リンク+毎朝9:30のWorker cron配信(Brevo)。
  有効化にはユーザーの Brevo アカウント接続が必要 → APIキーと検証済み送信元を、Cloudflareダッシュボード →
  Workers & Pages → antenna-ai → Settings → Variables and Secrets に **BREVO_API_KEY** / **SENDER_EMAIL** として設定。
  未設定の間、登録フォームは「準備中」を返し、cron配信は何もしない(安全側)。
- 経緯と実装記録は `.claude/docs/backlog.md` の [済 2026-08-27] 項を参照。

## ② 寄付/応援(未着手)

- 候補: Buy Me a Coffee か GitHub Sponsors。
- ユーザーがアカウント作成 → 公開URLを Claude に渡す → フッター等にボタン設置。

## ③ アフィリエイト(資格ページに実装済み・タグ待ち)

- 実装済み: `content/pages/context/certification.json` に `resources` ブロック(書籍のAmazon検索リンク)。
  [js/app.js] の `resources` レンダラが、Amazonリンクに対して **`site.json` の `affiliate.amazonTag`** を自動付与し、
  「PR」表示とアフィリエイト開示文も自動で出す(日本のステマ規制対応)。
- 現状 `affiliate.amazonTag` は空 → 今は通常の外部リンク(タグなし・PR非表示)として有効。
- **ユーザーがやること**: Amazonアソシエイト(https://affiliate.amazon.co.jp/)に登録し、**トラッキングID**(例 `xxxx-22`)を取得して Claude に渡す。
- **その後Claudeがやること**: `site.json` の `affiliate.amazonTag` に設定 → push。以後すべてのAmazonリンクが自動でタグ付き+PR表示になる。

### Amazonアソシエイト 申請フォームの記入内容(2026-08 決定)

| 欄 | 記入内容 |
|---|---|
| 希望する登録ID(半角英数) | `antennaai`(重複時の候補: `aiantenna` / `antennaainews`) |
| サイト/アプリの内容説明(全角256字以内) | 下記の定型文 |
| サイトの種類 | **コンテンツメディア / パブリッシャー / ブロガー** |
| プログラムを知った経緯 | 「その他」など任意(審査に影響しない) |
| 運営規約 | 同意にチェック |

説明文(コピペ用):
> 『ANTENNA』は、AI・LLMの最新動向と基礎知識をエンジニア向けに無料でまとめる学習メディアです。毎週の技術ニュース、用語辞典、仕組みの図解に加え、G検定・E資格などAI資格の学習ガイドを掲載しています。資格・学習関連の記事の中で、対応する技術書・問題集・参考書を読者に紹介する目的で、AmazonのリンクをPR表記のうえ掲載します。

- サイトURL入力欄には公開URL `https://antenna-ai.km-solo-developer.workers.dev` を使う。
- **確定トラッキングID**: `antennaai-22`(2026-08-22 発行)。`site.json` の `affiliate.amazonTag` に**設定済み**。
  → 資格ページのAmazonリンクは自動でタグ付き+「PR」表示+開示文が有効。
- 税務インタビュー(申請時): 個人 / 日本居住 / インボイス登録番号なし(いいえ)/ 消費税は免税事業者(いいえ)で回答。
  ※将来 年間売上が課税事業者の基準を超える、またはインボイス登録した場合は Amazon 側の税務情報を更新すること。
- 他ASP(もしも/A8/afb 等の講座アフィリ)を足す場合は resources ブロックにURLを追加する。

## 原則

- ステマ規制: アフィリンクは必ず「PR」明示(実装で自動化済み)。
- 広告主体・ペイウォールにはしない(GitHub由来の思想+Cloudflare無料枠の範囲を尊重)。
- 「仕込む」段階。スポンサー営業などの実弾は読者が貯まってから。
