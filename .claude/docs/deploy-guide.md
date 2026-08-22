# デプロイ手順(ユーザー向け)

ホスティング: **Cloudflare Pages(無料・商用利用OK・サーバーレス関数あり)**。
リポジトリは GitHub(`murakami-kaito-dev/AiNewsCurator`)。**git push = 自動デプロイ**。

コードはすべて相対パスなので、GitHub Pages でも Cloudflare でも改修なしで動く。

---

## 初回セットアップ(Cloudflare Pages への接続)

⚠️ この「接続」だけは**あなたのブラウザ操作が必要**です(あなたのCloudflareアカウントと
リポジトリを紐付けるため。Claude は代わりにログインできない)。所要3〜5分・一度きり。

**Git連携方式**を使う。これなら以後 `git push` するだけで自動デプロイされ、
週次自動更新エージェントの仕組みもそのまま生きる。

1. **Cloudflareアカウントを作る(無料)**: https://dash.cloudflare.com/sign-up
2. ダッシュボード左メニュー **「Workers & Pages」** → **「Create application」**
   → **「Pages」** タブ → **「Connect to Git」**
3. GitHub を連携(初回はGitHub側でアクセス許可)。リポジトリ **`AiNewsCurator`** を選び **「Begin setup」**
4. ビルド設定を次の通りにする:
   - **Project name**: 好きな名前(これが公開URL `<名前>.pages.dev` になる。例 `antenna-ai`)
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: 空欄のまま
   - **Build output directory**: `/`
5. **「Save and Deploy」** → 数十秒でビルド完了。**`https://<名前>.pages.dev`** で公開される。

公開できたら、その URL を Claude に教えてください。動作確認と、後片付け
(GitHub Pages 側の停止、ドキュメントのURL反映)を Claude が行います。

## スマホで「アプリ」にする(任意)

- **iPhone**: Safari で `pages.dev` のURLを開く → 共有 → 「ホーム画面に追加」
- **Android**: Chrome で開く → メニュー → 「アプリをインストール」

## 2回目以降のデプロイ

不要です。`main` に push するだけで Cloudflare が自動でビルド・反映します
(週次更新エージェントがこれを行う)。

## 独自ドメインを付けるとき(任意・後日)

Cloudflare Pages の該当プロジェクト → **「Custom domains」** → ドメインを追加。
ドメインをCloudflareで買う/移管すると設定が最短。マネタイズ時の信用度が上がる。

## サーバーレス関数(Cloudflare Functions)

`functions/` 配下に置いたJSが自動でAPIになる。動作確認用に `functions/api/health.js` を用意済み。
公開後 `https://<名前>.pages.dev/api/health` で `{"status":"ok",...}` が返れば疎通OK。
将来のニュースレター登録受付・クリック計測などはここに実装する。

---

## 付録: 旧 GitHub Pages 方式(参考・移行後は使わない)

初回に使った手順。Cloudflare へ移行後は GitHub Pages を停止する。

```bash
# リポジトリは作成済み。Pages の停止は:
gh api repos/murakami-kaito-dev/AiNewsCurator/pages -X DELETE
```

GitHub Pages 版URL(移行後停止予定): https://murakami-kaito-dev.github.io/AiNewsCurator/
