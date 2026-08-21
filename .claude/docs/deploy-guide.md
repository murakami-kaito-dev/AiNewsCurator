# デプロイ手順(ユーザー向け・初回のみ)

ホスティング: **GitHub Pages(完全無料)**。push = デプロイ。
アカウント: `murakami-kaito-dev`(gh CLI 認証済みを確認済み)

## 一番簡単な方法

新しいセッションで Claude に「**AiNewsCurator をデプロイして**」と言うだけです。
下記コマンドを Claude が実行し、権限プロンプトが出たら承認してください。

## 手動でやる場合(ターミナルにコピペ、2分)

```bash
cd /Users/kaitomurakami/Dev/Products/AiNewsCurator

# 1. パブリックリポジトリを作成して push(無料のPagesはパブリックが条件)
gh repo create AiNewsCurator --public \
  --description "ANTENNA — AI/LLMトレンドを自動受信するキュレーションPWA" \
  --source . --remote origin --push

# 2. GitHub Pages を有効化(main ブランチのルートを公開)
gh api repos/murakami-kaito-dev/AiNewsCurator/pages \
  -X POST -f "source[branch]=main" -f "source[path]=/"
```

数分後に公開されます:

**https://murakami-kaito-dev.github.io/AiNewsCurator/**

## スマホで「アプリ」にする(任意・30秒)

- **iPhone**: Safari で上記URLを開く → 共有ボタン → 「ホーム画面に追加」
- **Android**: Chrome で開く → メニュー → 「アプリをインストール」

以後はホーム画面のアイコンから全画面のアプリとして起動し、
一度読んだ号はオフラインでも読めます(Service Worker)。

## 2回目以降のデプロイ

不要です。`main` に push するだけで GitHub Pages が自動で反映します
(定期更新エージェントがこれを行います)。

## トラブルシューティング

- **404 が出る**: Pages の反映に最大10分かかることがある。
  `gh api repos/murakami-kaito-dev/AiNewsCurator/pages` で `"status"` を確認。
- **更新が反映されない**: PWA のキャッシュが古い。アプリを一度完全に閉じて
  開き直す(SWはネットワーク優先なのでオンラインなら通常は最新が出ます)。
