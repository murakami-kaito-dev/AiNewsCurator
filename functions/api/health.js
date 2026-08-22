// Cloudflare Pages Functions のスターター(サーバーレス関数の動作確認用テンプレート)。
// このファイルがあるだけで、公開後 https://<プロジェクト>.pages.dev/api/health でアクセスできる。
// GitHub Pages(静的のみ)では動かないが、Cloudflare では「サーバー側の処理」がここに書ける。
// 将来ここに実装できる例: ニュースレター登録の受け口 / スポンサークリックの計測 /
//   動的なOGP画像 / 簡易API。まずは疎通確認のヘルスチェックだけを返す。
export function onRequest() {
  return new Response(
    JSON.stringify({ status: "ok", service: "ANTENNA", runtime: "cloudflare-pages-functions" }),
    { headers: { "content-type": "application/json; charset=utf-8" } }
  );
}
