# AiNewsCurator (ANTENNA) — プロジェクトルール・情報の地図

AI/LLM のキャッチアップを自動化するドキュメント型 PWA。ユーザー個人のためのアプリ。
ホスティング: **Cloudflare Workers(静的アセット配信)**。リポジトリは GitHub。
公開URL: **https://antenna-ai.km-solo-developer.workers.dev**
(旧 GitHub Pages は移行完了に伴い停止)

## これは何か
- 静的サイト(ビルドステップなし)+ PWA。全パス相対指定なのでホスト非依存。**git push = 自動デプロイ**。
- Cloudflare は統合フロー(Workers Builds)で Git連携。`wrangler.jsonc`(静的アセット + `main`)で配信し、
  `worker/index.js` にサーバー側処理(`/api/*`)を書ける。内部ファイルは `.assetsignore` で公開除外。
- **シェル(HTML/CSS/JS)とコンテンツ(`content/` 配下のJSON)を分離**している。
  定期更新ではコンテンツJSONだけを触り、シェルは原則触らない。
- 毎週月曜 9:00 JST にスケジュール済みクラウドエージェントが自律更新
  (リサーチ → JSON更新 → 検証 → commit/push)。
- 情報設計はドキュメント型: セクション(トレンド/AIの基礎/AIを使う/AIを組み込む/周辺知識/用語辞典)
  → 子ページ。`content/site.json` がナビの正。

## 情報の地図
- 要件定義: `.claude/docs/requirements.md`
- **バックログ(今後やるべき対応): `.claude/docs/backlog.md`**(配信+ダブルオプトイン等の積み残し)
- マネタイズ運用: `.claude/docs/monetization.md`
- **コンテンツ様式ガイド: `.claude/docs/content-guide.md`**(スキーマ・文体・専門用語ルールの正)
- 定期更新の実行手順: `.claude/docs/update-runbook.md`
- リリースログ: `.claude/docs/release-log.md`
- デプロイ手順: `.claude/docs/deploy-guide.md` / 定期ルーチン設定の写し: `.claude/docs/routine-config.json`
- 検証スクリプト: `tools/validate.py`(JSON構文・リンク整合・site.json対応を一括検査)
- コンテンツ: `content/site.json`(ナビ) / `content/pages/<section>/<slug>.json`(記事) /
  `content/trends.json`(週次号アーカイブ) / `content/glossary.json`(用語辞典)

## 不変条件・禁忌
- コンテンツ更新時にシェルの構造(ルート、JSONスキーマ、demo id)を壊さない。
  スキーマを変えるならシェル側JSと content-guide.md を同時に変え、プレビュー確認する。
- **専門用語の全数ルール**(content-guide.md): 専門用語は説明かリンクなしに登場させない。
- 記事には必ず「なぜ重要か」を添える。日本語が主言語。
- サイトの文言に開発経緯・運用都合のメタ表現を書かない。
- push 前に `python3 tools/validate.py` を必ず通す。
- 定期更新の commit/push はユーザーから事前承認済み。それ以外は指示があったときのみ。
- 更新のたび release-log に記録する。
