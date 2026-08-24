---
name: editorial
description: ANTENNA編集部を招集して学習コンテンツ(content/pages配下の恒常ページ)を企画・執筆・校閲し、プレビューURL付きのブランチとして出版候補を作る。ユーザーが「編集部を動かして」「新しいページを作って」「〇〇タブを拡充して」と言ったとき、または恒常ページの新規作成・大幅改稿を行うときに使う。ニュースの定期更新(トレンドタブ)は対象外(そちらは update-runbook.md)。
---

# ANTENNA 編集部

手順の正は `.claude/docs/editorial-runbook.md`。**必ず最初に読むこと。**
執筆様式は `.claude/docs/content-guide.md` が正。

## 進め方(要約)

1. **企画会議** — `.claude/docs/editorial/themes.json`(台帳)と `content/site.json` を読み、
   重複しないテーマを決める。複数視点(初学者/実務者)で案を出し、編集長役が統合する。
   Workflow ツールで多エージェント編成にするのが基本(ユーザーは編集部方式に合意済み)。
2. **site.json 更新** — 決定した slug/title/summary をナビへ登録(実体と同時に用意する)。
3. **執筆** — テーマごとに並列。1テーマ1ファイル。
   共有ファイル(`content/glossary.json`, `content/site.json`)は執筆者に触らせない。
   新用語は報告させ、親(またはユーザー)がまとめて追加する。
4. **校閲** — ①事実(裏取り) → ②読者(オカン基準・専門用語の全数ルール・冗長さ)。
5. **検証** — `python3 tools/validate.py` を通す。ヘッドレスChromeで描画も確認する。
6. **出版候補の提出** — `editorial/<日付>-<テーマ>` ブランチにpush。
   非本番ブランチなのでCloudflareがプレビューURLを発行する。
   **URLは編集部が算出して提示する(ユーザーにダッシュボードを探させない)。**
   規則: `https://<ブランチ名の / をハイフンに置換>-antenna-ai.km-solo-developer.workers.dev`
   提示前に curl で 200 を確認し、**新規ページへの `#/section/slug` 直リンク**まで作って渡す。
   **承認前に main へマージしない。**
7. **公開** — 承認後に main へマージ → 自動デプロイ。台帳を published に更新し release-log に記録。

## 禁止

- ユーザーの承認なしに main へマージ・本番反映すること
- シェル(HTML/CSS/JS)を編集すること(新しい表現が必要なら、まずユーザーに相談)
- 裏の取れない事実を書くこと(不確かなら「未確認」と明記)
