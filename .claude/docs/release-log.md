# Release Log — AiNewsCurator

「どのバージョンに何が入っていて、今どの状態か」を新しいセッションでも即わかるようにする記録。
静的サイトのため「ビルド」は存在せず、**push = デプロイ**(Cloudflare Workers が自動ビルド)。

## editorial 2026.08.23 — 「AIを使う」タブに6ページ追加(第1回編集会議)
- 状態: 公開済み(ユーザー承認のうえ main へマージ)。
- 追加ページ: use/delegation, iteration, context-engineering, verification, model-selection, reusable-workflows
  (「AIを使う」は4→10ページに。入門→実務→習熟の階段構成、全ページに図解 flow/table)
- 用語辞典に3語追加(lost-in-the-middle / prompt-caching / idempotency、計78語)。
- basics/capability から use/delegation への導線を追加。content-guide を実態に更新(h2は3〜5節・分量1200〜2000字・図解優先)。
- 編集部を常設化(editorial-runbook.md / editorial スキル / テーマ台帳)。

## feat 2026.08.22 — マネタイズの仕込み(ニュースレター土台 + アフィリエイト枠)
- 状態: 実装・公開済み。ただし**有効化はユーザーのアカウント作業待ち**(monetization.md)。
- ① ニュースレター(Cloudflare自前・KV): 登録フォーム+`/api/subscribe`(KV保存)を実装。
  `site.json` の `newsletter.enabled=false` で現在は非表示。KV名前空間作成→ID受領→バインディング追加で有効化。
- ③ アフィリエイト: 資格ページに `resources` ブロック(書籍のAmazon検索リンク)。`site.json` の
  `affiliate.amazonTag` を設定すると全Amazonリンクに自動でタグ付与+「PR」表示(ステマ規制対応)。現在タグ空=通常リンク。
- 詳細と残作業(KV作成 / Amazonアソシエイト登録)は `.claude/docs/monetization.md`。

## infra 2026.08.22 — ホスティングを Cloudflare へ移行(Workers 静的アセット構成)【完了】
- 状態: **移行完了・公開確認済み**。公開URL: https://antenna-ai.km-solo-developer.workers.dev
  - 確認: トップ200 / site.json(6セクション) / 記事 / glossary(75語) / `/api/health` 疎通OK / 内部ファイルは全404(公開されず)。
  - 旧 GitHub Pages は停止(重複回避)。
- 理由: 商用利用が規約上OK / サーバーレス関数が使える。
- 経緯: ユーザーのアカウントは新統合フロー(Workers Builds)で Pages/Workers の選択が出ないため、
  Pages ではなく **Workers の静的アセット機能** で配信する構成に決定。
- 追加: `wrangler.jsonc`(name=antenna-ai / assets=リポジトリ直下 / main=worker)、`worker/index.js`(`/api/health` 実装)、
  `.assetsignore`(内部ファイルを公開除外)、`_headers`(週次更新の即時反映)。旧 `functions/`(Pages専用)は削除。
- コード変更なし(全パス相対のためホスト非依存)。デプロイは `npx wrangler deploy`(push→自動デプロイ、週次エージェントも維持)。
- 残: ユーザーが Cloudflare に接続・Deploy → 公開URL(`antenna-ai.<...>.workers.dev`)確定 → 動作確認後に旧 GitHub Pages を停止。

## v2026.08.23 — v2 全面改訂「オカン基準」ドキュメントサイト化
- 状態: 配信済み(2026-08-23、フィードバック反映の大規模リリース)
- 内容:
  - 情報設計をドキュメント型に全面再構築(6セクション・28記事ページ・用語辞典75語)
  - 「オカン基準」+専門用語の全数ルールで全コンテンツ書き直し(様式: content-guide.md)
  - サイト内全文検索、トレンドアーカイブ(号別ページ)、デモ2本追加(tokenize/temperature)
  - トレンドを週次化: 8月分3号をバックフィル(v2026.08.09 / 08.16 / 08.22)+創刊特別号(v2026.02-07)
  - 定期ルーチンを毎週月曜 9:00 JST に変更(trig_01YS47DTA4oS1idnmN5JQo8G)
  - 検証スクリプト tools/validate.py 追加(push前必須)
- 配信先: GitHub Pages(push済み)

## v2026.08.22 — 初回リリース(創刊号「エージェントの年、後半戦へ」)
- 状態: **配信済み**(2026-08-22、ユーザー承認のうえデプロイ実行)
- 内容: アプリシェル(8タブ PWA)+ 初回コンテンツ一式(2026年2月〜8月の総まとめ号)
- 配信先: GitHub Pages https://murakami-kaito-dev.github.io/AiNewsCurator/ (公開確認済み・HTTP 200)
- 定期更新: ルーチン `trig_01YS47DTA4oS1idnmN5JQo8G` 作成済み(毎月1日・15日 9:00 JST、claude-sonnet-5)。
  管理画面: https://claude.ai/code/routines 。設定の写し: `routine-config.json`
