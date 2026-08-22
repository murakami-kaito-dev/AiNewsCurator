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
- 登録者の閲覧: CloudflareダッシュボードのKVビューアで一覧可能。送信(実際の配信)は別途メール送信手段を接続する将来課題。

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
- 他ASP(もしも/A8/afb 等の講座アフィリ)を足す場合は resources ブロックにURLを追加する。

## 原則

- ステマ規制: アフィリンクは必ず「PR」明示(実装で自動化済み)。
- 広告主体・ペイウォールにはしない(GitHub由来の思想+Cloudflare無料枠の範囲を尊重)。
- 「仕込む」段階。スポンサー営業などの実弾は読者が貯まってから。
