# 定期更新ランブック(2週間ごと・エージェント向け)

このドキュメントは、定期更新を実行する Claude エージェントの作業手順の正。
所要: リサーチ → 執筆 → 検証 → デプロイ → 記録。

## 0. 原則

- 触るのは `content/*.json` と `.claude/docs/release-log.md` のみ。
  シェル(HTML/CSS/JS)は原則触らない(CLAUDE.md 不変条件)。
- すべての記事に「なぜ重要か」(`why`)を必ず添える。日本語。
- 事実(日付・名称・数値)は検索結果に基づき、不確かなものは書かないか「未確認」と明記。
- このプロジェクトでは定期更新の commit/push はユーザーから事前承認済み。

## 1. リサーチ(WebSearch / WebFetch)

日英両方で、直近2週間を対象に:
1. 主要モデルのリリース・アップデート(Anthropic / OpenAI / Google / オープン勢)
2. コーディングエージェント・開発ツールの動向
3. MCP / A2A 等エコシステムの動き
4. 新しい概念・用語の登場や流行
5. 企業・現場での活用事例
6. 能力境界の変化(METR等のベンチマーク動向)
7. 萌芽期の概念の状態変化(radar の STAGE 昇格・降格の根拠)

## 2. コンテンツ更新

- `content/trends.json` … 新しい号(issue)を **`issues` 配列の先頭に** 追加。
  `version: "vYYYY.MM.DD"`、`updated` も同日に更新。過去号は残す(アーカイブ)。
  1号あたり5〜8記事。カテゴリは モデル/ツール/概念/エコシステム/事例/能力境界 から。
- `content/glossary.json` … 新用語があれば追加(context に「いつ・なぜ流行ったか」)。
- `content/capability-map.json` … 境界を越えた項目は can へ移し `moved: "YYYY"` を付す。
- `content/radar.json` … STAGE 昇格・降格・新規観測を反映。
- `content/history.json` … 歴史的な出来事(大型リリース等)があれば現在の era に追記。
- `content/in-practice.json` … 重要な新事例があれば追加・差し替え。
- `content/mechanism.json` / `roadmap.json` … 原則安定。誤りの修正のみ。
- 各ファイルの `updated` は更新した場合のみ書き換える。

## 3. 検証(必須)

```bash
cd /Users/kaitomurakami/Dev/Products/AiNewsCurator
for f in content/*.json; do python3 -m json.tool "$f" > /dev/null || echo "NG $f"; done
```

NG が1つでもあれば push しない。可能ならローカルサーバ+ヘッドレスChromeで
trends タブのスクリーンショットを撮り、描画崩れがないか目視する。

## 4. デプロイと記録

```bash
git add content/ .claude/docs/release-log.md
git commit -m "receive vYYYY.MM.DD — <号のheadline>

Co-Authored-By: <実行モデル名> <noreply@anthropic.com>"
git push origin main   # push = デプロイ(GitHub Pages)
```

- `.claude/docs/release-log.md` の先頭に新しい号のエントリを追加:
  バージョン / 日付 / 号の headline / 主な更新ファイル / 「配信: GitHub Pages(push済み)」

## 5. 失敗時

- リサーチ結果が薄い(重要ニュースがない)場合でも号は出す。
  「静かな2週間だった」という事実も受信結果として価値がある(記事2〜3本でも可)。
- push が失敗したらリモート状態を確認し、解決できなければ作業内容をコミットだけして
  ユーザーへの報告に残す(勝手に force push しない)。
