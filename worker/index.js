// ANTENNA の Worker 本体(Cloudflare Workers 静的アセット構成)。
// 静的ファイル(HTML/CSS/JS/JSON)に一致するリクエストは Cloudflare が直接配信し、
// それ以外(下記の /api/*)だけこの Worker が処理する。将来のサーバー側機能はここに足す。
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 動作確認用エンドポイント(サーバーレス関数が動いている証拠)
    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "ANTENNA",
        runtime: "cloudflare-workers",
      });
    }

    // それ以外は静的アセットにフォールバック
    return env.ASSETS.fetch(request);
  },
};
