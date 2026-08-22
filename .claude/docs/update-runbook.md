# 定期更新ランブック(毎週・エージェント向け)

このドキュメントは、定期更新を実行する Claude エージェントの作業手順の正。
所要: リサーチ → 執筆 → 検証 → デプロイ → 記録。

## 0. 原則

- 触るのは `content/` 配下のJSONと `.claude/docs/release-log.md` のみ。
  シェル(HTML/CSS/JS)は原則触らない(CLAUDE.md 不変条件)。
- 執筆様式・スキーマ・専門用語ルールは `.claude/docs/content-guide.md` が正。必ず先に読む。
- すべての記事に「なぜ重要か」(`why`)を必ず添える。日本語。
- 事実(日付・名称・数値)は検索結果に基づき、不確かなものは書かないか「未確認」と明記。
- サイトの文言に開発経緯・運用都合(「◯週間ごとに更新」等のメタ表現)を持ち込まない。
- このプロジェクトでは定期更新の commit/push はユーザーから事前承認済み。

## 1. リサーチ(WebSearch / WebFetch)

日英両方で、**直近1週間**を対象に、ニュース5カテゴリで調査:
1. **新モデル** — 各社モデルのリリース・アップデート
2. **ツール・サービス** — Claude Code、Cursor等の開発ツール、主要AIサービスの更新
3. **企業・業界** — 資金調達、提携、導入事例、人事、業界構造の変化
4. **規制・倫理** — 各国規制、著作権、セキュリティインシデント
5. **研究・論文** — 注目論文、ベンチマーク、新概念の登場

## 2. コンテンツ更新

- `content/trends.json` … 新しい号(issue)を **`issues` 配列の先頭に** 追加。
  `version: "vYYYY.MM.DD"`(実行日)、`date` は対象期間(例「2026年8月24日〜8月30日」)、
  `updated` も更新。過去号は残す(アーカイブとして自動表示される)。
  1号あたり4〜8記事。category は上記5分類のいずれか。
  静かな週でも号は出す(2〜3記事でも可。「静かだった」ことにも情報価値がある)。
- `content/glossary.json` … 新用語があれば content-guide.md のスキーマで追加。
  追加した slug は content-guide.md の「用語slug一覧」にも追記する。
- `content/pages/**` … 能力境界の変化(basics/capability)、業界地図・レーダーの変化(context/industry)、
  規制の大きな動き(context/ethics)など、**恒常ページの記述が古くなった場合のみ**差分更新し、
  該当ページの `updated` を書き換える。歴史的な大事件は context/history に追記。
- `content/site.json` … ページの追加・削除をした場合のみ更新(通常は触らない)。

## 3. 検証(必須)

```bash
cd /Users/kaitomurakami/Dev/Products/AiNewsCurator
python3 tools/validate.py
```

`tools/validate.py` は 全JSONの構文 / site.jsonとpagesの対応 / 全 [[...]] リンクの整合 /
demo idの実在 を検査する。**エラーが1つでもあれば push しない**(修正してから)。

## 4. デプロイと記録

```bash
git add content/ .claude/docs/
git commit -m "receive vYYYY.MM.DD — <号のheadline>

Co-Authored-By: <実行モデル名> <noreply@anthropic.com>"
git push origin main   # push = デプロイ(GitHub Pages)
```

- `.claude/docs/release-log.md` の先頭に新しい号のエントリを追加:
  バージョン / 日付 / 号のheadline / 主な更新ファイル / 「配信: GitHub Pages(push済み)」

## 5. 失敗時

- push が失敗したらリモート状態を確認し、解決できなければ作業内容をコミットだけして
  ユーザーへの報告に残す(勝手に force push しない)。
