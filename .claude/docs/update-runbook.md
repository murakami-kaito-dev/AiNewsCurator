# 定期更新ランブック(1日おき・エージェント向け)

このドキュメントは、定期更新を実行する Claude エージェントの作業手順の正。
所要: リサーチ → 執筆 → 検証 → デプロイ → 記録。

## 0. 原則

- 触るのは `content/` 配下のJSONと `.claude/docs/release-log.md` のみ。
  シェル(HTML/CSS/JS)は原則触らない(CLAUDE.md 不変条件)。
- 執筆様式・スキーマ・専門用語ルールは `.claude/docs/content-guide.md` が正。必ず先に読む。
- すべての記事に解説(`explanation`)を必ず添える。日本語。
  「なぜ重要か」等のラベル文言は本文に書かない(表示側が Briefing / 解説 の見出しを付ける)。
- 事実(日付・名称・数値)は検索結果に基づき、不確かなものは書かないか「未確認」と明記。
- サイトの文言に開発経緯・運用都合(「◯週間ごとに更新」等のメタ表現)を持ち込まない。
- このプロジェクトでは定期更新の commit/push はユーザーから事前承認済み。

## 1. リサーチ(WebSearch / WebFetch)

日英両方で、**前回更新から今回まで(およそ直近2日。動きが少なければ直近1週間まで遡ってよい)**を対象に、
ニュース5カテゴリで調査:
1. **新モデル** — 各社モデルのリリース・アップデート
2. **ツール・サービス** — Claude Code、Cursor等の開発ツール、主要AIサービスの更新
3. **企業・業界** — 資金調達、提携、導入事例、人事、業界構造の変化
4. **規制・倫理** — 各国規制、著作権、セキュリティインシデント
5. **研究・論文** — 注目論文、ベンチマーク、新概念の登場

### 選定の基準(重要)

「トレンド」なので、**いま世間で広く取り上げられている・注目されているもの**を優先する:
- 主要メディアが報じた / 技術コミュニティ(X・Hacker News・Reddit・Qiita/Zenn等)で話題になっている
- 公式発表があり、実際に使える・影響が及ぶもの
- ニッチすぎる話題や、誰も話題にしていない小さな更新は入れない

同時に、**実務に効く技術的トピックは積極的に扱う**(歓迎):
- Claude の Skills / サブエージェント / フック等のエージェント機能、MCP・A2A等の標準、
  コーディングエージェントの新機能、開発手法(ハーネス/ループエンジニアリング等)の新潮流。
- 「話題性」と「技術的な実利」の両方を満たすものが最良。片方しかない場合は、
  話題性が非常に高いか、技術的な実利が非常に大きいものを選ぶ。

## 2. コンテンツ更新

- `content/trends.json` … 新しい号(issue)を **`issues` 配列の先頭に** 追加。
  `version: "vYYYY.MM.DD"`(実行日)、`date` は対象期間(例「2026年8月24日〜8月25日」)、
  `updated` も更新。過去号は残す(アーカイブとして自動表示される)。
  1号あたり4〜8記事。category は上記5分類のいずれか。
  動きが少ない回でも号は出す(2〜3記事でも可。「静かだった」ことにも情報価値がある)。
  - **各記事(item)のスキーマ**:
    - `title`(見出し), `category`(5分類), `source`(出典URL) — 必須
    - `lead`(冒頭文。一覧と詳細の冒頭に出る導入。1〜3文) — 必須
    - `body`(冒頭文の続き。背景・事実の続き。1〜3文) — 任意だが推奨
    - `briefing`(要点の箇条書き。**文字列の配列**で2〜4項目) — 推奨
    - `explanation`(解説。意味・影響・文脈の深掘り。1〜3文) — 必須
    - ※旧 `summary`/`why` は廃止。`summary`→`lead`、`why`→`explanation` に相当。
    - ※「なぜ重要か」等のラベルは本文に書かない(表示側が「Briefing」「解説」の見出しを付ける)。
  - **重複を出さない(必須)**: 新しい号を作る前に、`content/trends.json` の**既存の全号**の
    各記事の `source` URL と `title` を確認し、**すでに掲載済みのニュースは再掲しない**。
    同一の出来事は最初に扱った号にのみ載せ、続報がある場合のみ「続報」と分かる新規記事として扱う。
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
git push origin main   # push = 自動デプロイ(Cloudflare Workers が検知してビルド)
```

- `.claude/docs/release-log.md` の先頭に新しい号のエントリを追加:
  バージョン / 日付 / 号のheadline / 主な更新ファイル / 「配信: Cloudflare Workers(push済み=自動デプロイ)」

## 5. 失敗時

- push が失敗したらリモート状態を確認し、解決できなければ作業内容をコミットだけして
  ユーザーへの報告に残す(勝手に force push しない)。
