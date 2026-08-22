# Release Log — AiNewsCurator

「どのバージョンに何が入っていて、今どの状態か」を新しいセッションでも即わかるようにする記録。
静的サイトのため「ビルド」は存在せず、**push = デプロイ**(Cloudflare Pages が自動ビルド)。

## infra 2026.08.22 — ホスティングを Cloudflare Pages へ移行
- 状態: リポジトリ側の準備完了・コミット済み。**Cloudflare への接続はユーザーのブラウザ操作待ち**(deploy-guide.md)。
- 理由: 商用利用が規約上OK / サーバーレス関数(Functions)が使える / `<project>.pages.dev` が github.io より綺麗。
- 追加: `_headers`(週次更新の即時反映)、`functions/api/health.js`(Functions疎通テンプレート)。
- コード変更なし(全パス相対のためホスト非依存)。移行方式は Git連携(push→自動デプロイ、週次エージェントの自動更新も維持)。
- 残: ユーザーが Cloudflare Pages に接続 → 公開URL確定 → 動作確認後に旧 GitHub Pages を停止。

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
