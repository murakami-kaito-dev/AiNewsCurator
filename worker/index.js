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

    // ニュースレター登録の受け口。メールを KV(env.SUBSCRIBERS)に保存する。
    // KV バインディングが未設定の間は 503 を返す(フォームは site.json のフラグで非表示なので通常呼ばれない)。
    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
      }
      if (!env.SUBSCRIBERS) {
        return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      // ボット対策のハニーポット(人間には見えない項目。入っていたら黙って成功扱い)
      if ((body.company || "").trim()) return Response.json({ ok: true });
      const email = (body.email || "").trim().toLowerCase();
      const valid = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
      const existing = await env.SUBSCRIBERS.get(email);
      if (!existing) {
        await env.SUBSCRIBERS.put(
          email,
          JSON.stringify({ ts: Date.now(), ua: request.headers.get("user-agent") || "" })
        );
      }
      return Response.json({ ok: true });
    }

    // それ以外は静的アセットにフォールバック
    return env.ASSETS.fetch(request);
  },
};
