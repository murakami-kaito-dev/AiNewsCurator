# デプロイ手順(ユーザー向け)

ホスティング: **Cloudflare Workers(静的アセット配信・無料・商用OK・サーバーレス関数あり)**。
リポジトリは GitHub(`murakami-kaito-dev/AiNewsCurator`)。**git push = 自動デプロイ**。

このサイトは静的ファイル(全パス相対)+ 最小の Worker(API用)で構成。配信に必要な
`wrangler.jsonc` / `worker/index.js` / `.assetsignore` はリポジトリに用意済み。

---

## このアカウントのフローについて

Cloudflare の新しい統合フロー(Workers Builds)では、「Create application」で
**Workers / Pages の選択肢は出ず、そのまま設定画面に進む**。よって Workers の静的アセット機能で配信する
(そのための `wrangler.jsonc` を用意してある)。以前の「Pagesフロー(Framework preset を選ぶ画面)」は使わない。

## 初回セットアップ

⚠️ この接続だけは**あなたのブラウザ操作が必要**(あなたのCloudflareアカウントとリポジトリの紐付けのため)。
所要3〜5分・一度きり。以後は `git push` で自動デプロイされ、週次自動更新エージェントもそのまま生きる。

1. **Cloudflareアカウント作成(無料)**: https://dash.cloudflare.com/sign-up
   (ログイン情報は Git管理外の `.local/CloudFlareLoginInfo.txt`。※平文なので取扱注意)
2. ダッシュボード **「Workers & Pages」** → **「Create application」** → リポジトリ **`AiNewsCurator`** を選んで進む
3. 設定画面で、下の【確定した設定】の通りに入力する(重要な項目):
   - **Project name**: `antenna-ai`
   - **Build command**: 空欄のまま
   - **Deploy command**: `npx wrangler deploy`(初期値のまま)
   - **(Advanced settings) Non-production branch deploy command**: `npx wrangler versions upload`(初期値のまま)
   - **(Advanced settings) Path**: `/`(初期値のまま)
   - **API token**: **「Create new token」を選ぶ**(Cloudflareが適切な権限のトークンを自動生成する)。
     `API token name` は任意(空でも可。付けるなら `antenna-ai-deploy` など)
   - **Variable name / Variable value**: **空欄**(このサイトでは環境変数は不要)
4. **「Deploy」** をクリック → ビルド&デプロイが走る(1〜2分)。
5. 完了すると公開URLが割り当てられる。Workers の場合 **`antenna-ai.<アカウント名>.workers.dev`** の形になる。
   **そのURLを Claude に伝える** → 動作確認(サイト表示 + `/api/health` の疎通)、
   旧 GitHub Pages の停止、ドキュメントのURL確定反映、までを Claude が行う。

## 【確定した設定】(記録)

| 項目 | 値 |
|---|---|
| 作成フロー | 統合フロー(Workers Builds。Pages/Workers の選択は出ない) |
| Project name | `antenna-ai` |
| 公開URL | **https://antenna-ai.km-solo-developer.workers.dev**(2026-08-22 デプロイ完了・確認済み) |
| Build command | (空欄) |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |
| Path | `/` |
| API token | 「Create new token」で自動生成 / name は任意(`antenna-ai-deploy`) |
| Variables | なし |
| 配信構成 | `wrangler.jsonc` + `worker/index.js`(静的アセット + `/api/*` ルート) |
| 公開除外 | `.assetsignore`(`.claude/` `tools/` `worker/` 等の内部ファイルは配信しない) |
| ログイン情報の保管場所 | `.local/CloudFlareLoginInfo.txt`(Git管理外・平文注意) |

## スマホで「アプリ」にする(任意)

- **iPhone**: Safari で公開URLを開く → 共有 → 「ホーム画面に追加」
- **Android**: Chrome で開く → メニュー → 「アプリをインストール」

## 2回目以降のデプロイ

不要。`main` に push するだけで Cloudflare が自動でビルド・反映する(週次更新エージェントがこれを行う)。

## サーバーレス関数(Worker)

`worker/index.js` にサーバー側処理を書ける。動作確認用に `/api/health` を実装済み
(公開後 `https://<公開URL>/api/health` で `{"status":"ok",...}` が返ればOK)。
将来のニュースレター登録受付・クリック計測などはここに追加する。

## 独自ドメイン(任意・後日)

Cloudflare の該当プロジェクト → カスタムドメイン設定で追加できる。マネタイズ時の信用度が上がる。

---

## 付録: 旧 GitHub Pages の停止(Cloudflare公開を確認してから)

```bash
gh api repos/murakami-kaito-dev/AiNewsCurator/pages -X DELETE
```

GitHub Pages 版URL(移行後に停止): https://murakami-kaito-dev.github.io/AiNewsCurator/
