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
- 毎日 7:00 JST にスケジュール済みクラウドエージェントが自律更新
  (リサーチ → JSON更新 → 検証 → commit/push)。
- ニュースレター: ダブルオプトイン式(worker/index.js)。毎朝 7:30/8:00/8:30 JST に Worker の cron が
  新しい号を検知して confirmed 読者へ配信(Brevo。受信者単位の既読管理で二重送信しない)。詳細: monetization.md
- **配信の状態は `GET /api/status`(秘密なし)で確認**。監視エージェント trig_01XfmGi9tbVmU9V86Xd2CeDq が
  毎朝8:45 JSTに点検し正常/異常を必ずメール(来ない日=監視停止の合図)。手順・思想は update-runbook.md の §0-A。
- 情報設計はドキュメント型: セクション(トレンド/AIの基礎/AIを使う/AIを組み込む/周辺知識/用語辞典)
  → 子ページ。`content/site.json` がナビの正。

## 情報の地図
- 要件定義: `.claude/docs/requirements.md`
- **バックログ(今後やるべき対応): `.claude/docs/backlog.md`**(配信+ダブルオプトイン等の積み残し)
- マネタイズ運用: `.claude/docs/monetization.md`
- **コンテンツ様式ガイド: `.claude/docs/content-guide.md`**(スキーマ・文体・専門用語ルールの正)
- 定期更新(トレンド)の実行手順: `.claude/docs/update-runbook.md`
- **編集部(学習コンテンツの企画・執筆・校閲): `.claude/docs/editorial-runbook.md`**
  スキル `editorial` で招集。テーマ台帳は `.claude/docs/editorial/themes.json`。
  成果物はブランチ+プレビューURLで提示し、**ユーザーの承認後に main へマージ**する。
- **リリースログ: `docs/release-log.md`**(`.claude/` の外。理由は「不変条件・禁忌」を参照)
- デプロイ手順: `.claude/docs/deploy-guide.md` / 定期ルーチン設定の写し: `.claude/docs/routine-config.json`
- 検証スクリプト: `tools/validate.py`(JSON構文・リンク整合・site.json対応を一括検査)
- コンテンツ: `content/site.json`(ナビ) / `content/pages/<section>/<slug>.json`(記事) /
  `content/trends.json`(号アーカイブ) / `content/glossary.json`(用語辞典)

## 不変条件・禁忌
- コンテンツ更新時にシェルの構造(ルート、JSONスキーマ、demo id)を壊さない。
  スキーマを変えるならシェル側JSと content-guide.md を同時に変え、プレビュー確認する。
- **専門用語の全数ルール**(content-guide.md): 専門用語は説明かリンクなしに登場させない。
- トレンド記事には必ず解説(`explanation`)を添える。日本語が主言語。
- サイトの文言に開発経緯・運用都合のメタ表現を書かない。
- push 前に `python3 tools/validate.py` を必ず通す。
- 定期更新の commit/push はユーザーから事前承認済み。それ以外は指示があったときのみ。
- 更新のたび release-log に記録する。
- **`docs/release-log.md` を `.claude/` 配下に戻さない。** `.claude/**` への書き込みは
  センシティブファイル判定で承認プロンプトが出るため、**無人の定期実行が承認待ちで停止する**
  (2026-08-25 に実際に発生。記事執筆も検証も終わった状態で配信できず)。
  同じ理由で、**配信(content の commit/push)を release-log の記録より先に完了させる**
  — 記録で詰まっても配信だけは通る順序にする(update-runbook §4)。
- `docs/` は内部ドキュメント置き場。**`.assetsignore` に必ず載せる**(載せ忘れると社内メモが公開される)。
