// ANTENNA の Worker 本体(Cloudflare Workers 静的アセット構成)。
// 静的ファイルに一致するリクエストは Cloudflare が直接配信し、/api/* だけこの Worker が処理する。
//
// ニュースレターの仕組み(ダブルオプトイン):
//   POST /api/subscribe   … pending で保存し、確認メールを送る(Brevo)
//   GET  /api/confirm     … 確認リンクの着地。token 一致で confirmed に昇格
//   GET  /api/unsubscribe … 解除リンクの着地。登録を削除
//   scheduled(cron)       … 新しい号が出ていたら confirmed 全員へ配信(毎朝7:30 JST)
//
// 必要な設定(Cloudflareダッシュボード → Worker → Settings → Variables):
//   Secret BREVO_API_KEY … Brevo の APIキー
//   Secret SENDER_EMAIL  … Brevo で検証済みの送信元メールアドレス
//   (未設定の間、登録APIは not_configured を返し、cron配信は何もしない)

const SITE_NAME = "ANTENNA";
const SITE_URL = "https://antenna-ai.km-solo-developer.workers.dev";
const LINK_RE = /\[\[(?:glossary|page):[a-z0-9/-]+\|([^\]]+)\]\]/g;
const plain = (s) => String(s || "").replace(LINK_RE, "$1");

function configured(env) {
  return Boolean(env.BREVO_API_KEY && env.SENDER_EMAIL && env.SUBSCRIBERS);
}

async function sendMail(env, to, subject, text) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: SITE_NAME, email: env.SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const page = (title, body) => new Response(
  `<!DOCTYPE html><html lang="ja"><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — ${SITE_NAME}</title>
<body style="font-family:sans-serif;max-width:32em;margin:15vh auto 0;padding:0 1.5em;line-height:1.9;color:#1B2030;background:#F5F6FA">
<h1 style="font-size:1.3em">${title}</h1><p>${body}</p>
<p><a href="${SITE_URL}" style="color:#2059D6">${SITE_NAME} を開く</a></p></body></html>`,
  { headers: { "content-type": "text/html; charset=utf-8" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 動作確認用エンドポイント
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", service: SITE_NAME, runtime: "cloudflare-workers",
        newsletter: configured(env) ? "configured" : "not_configured",
        // 診断用: どの設定が見えているか(真偽のみ。値は絶対に出さない)
        env_seen: { BREVO_API_KEY: Boolean(env.BREVO_API_KEY), SENDER_EMAIL: Boolean(env.SENDER_EMAIL), SUBSCRIBERS_KV: Boolean(env.SUBSCRIBERS) } });
    }

    // 登録(ダブルオプトイン: pending 保存 → 確認メール)
    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
      }
      if (!configured(env)) {
        return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
      }
      let body;
      try { body = await request.json(); } catch {
        return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      // ボット対策のハニーポット(人間には見えない項目。入っていたら黙って成功扱い)
      if ((body.company || "").trim()) return Response.json({ ok: true, state: "pending" });
      const email = (body.email || "").trim().toLowerCase();
      const valid = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });

      const existing = JSON.parse((await env.SUBSCRIBERS.get(email)) || "null");
      if (existing && existing.status === "confirmed") {
        return Response.json({ ok: true, state: "already_confirmed" });
      }
      const token = crypto.randomUUID().replaceAll("-", "");
      await env.SUBSCRIBERS.put(email, JSON.stringify({
        status: "pending", token, ts: Date.now(), ua: request.headers.get("user-agent") || "",
      }));
      const q = `e=${encodeURIComponent(email)}&t=${token}`;
      try {
        await sendMail(env, email,
          `[${SITE_NAME}] 登録の確認`,
          `${SITE_NAME} への登録を受け付けました。\n\n` +
          `下のリンクを開くと登録が完了し、毎日の新着号がメールで届くようになります。\n` +
          `${SITE_URL}/api/confirm?${q}\n\n` +
          `心当たりがない場合は、このメールを無視してください(何も起こりません)。\n`);
      } catch (e) {
        console.log("confirm mail failed:", String(e).slice(0, 200));
        return Response.json({ ok: false, error: "send_failed" }, { status: 502 });
      }
      return Response.json({ ok: true, state: "pending" });
    }

    // 確認リンクの着地
    if (url.pathname === "/api/confirm") {
      const email = (url.searchParams.get("e") || "").toLowerCase();
      const token = url.searchParams.get("t") || "";
      const rec = JSON.parse((await env.SUBSCRIBERS?.get(email)) || "null");
      if (!rec || !rec.token || rec.token !== token) {
        return page("このリンクは無効です", "リンクの期限が切れたか、既に解除されています。もう一度サイトから登録してください。");
      }
      rec.status = "confirmed"; rec.confirmedAt = Date.now();
      await env.SUBSCRIBERS.put(email, JSON.stringify(rec));
      return page("登録が完了しました", "毎日の新着号をメールでお届けします。解除はメール内のリンクからいつでもできます。");
    }

    // 解除リンクの着地
    if (url.pathname === "/api/unsubscribe") {
      const email = (url.searchParams.get("e") || "").toLowerCase();
      const token = url.searchParams.get("t") || "";
      const rec = JSON.parse((await env.SUBSCRIBERS?.get(email)) || "null");
      if (rec && rec.token === token) {
        await env.SUBSCRIBERS.delete(email);
        return page("解除しました", "配信を停止しました。ご利用ありがとうございました。またいつでも登録できます。");
      }
      return page("このリンクは無効です", "既に解除済みか、リンクが正しくありません。");
    }

    // 配信の状態確認(監視用。秘密は出さず、版・件数・発火時刻のみ)
    if (url.pathname === "/api/status") {
      const [lastSent, lastCronAt, lastDeliverAt] = await Promise.all([
        env.SUBSCRIBERS?.get("__meta_last_sent"),
        env.SUBSCRIBERS?.get("__meta_last_cron_at"),
        env.SUBSCRIBERS?.get("__meta_last_deliver_at"),
      ]);
      let latest = null;
      try {
        const r = await env.ASSETS.fetch(new Request(SITE_URL + "/content/trends.json"));
        if (r.ok) { const t = await r.json(); latest = (t.issues && t.issues[0] && t.issues[0].version) || null; }
      } catch {}
      let confirmed = 0, pending = 0, cursor;
      if (env.SUBSCRIBERS) do {
        const l = await env.SUBSCRIBERS.list({ cursor });
        for (const k of l.keys) {
          if (k.name.startsWith("__meta")) continue;
          const rec = JSON.parse((await env.SUBSCRIBERS.get(k.name)) || "null");
          if (rec && rec.status === "confirmed") confirmed++;
          else if (rec && rec.status === "pending") pending++;
        }
        cursor = l.list_complete ? null : l.cursor;
      } while (cursor);
      return Response.json({
        configured: configured(env),
        latestIssue: latest,
        lastSent: lastSent || null,
        delivered: !!(latest && lastSent === latest),
        lastCronAt: lastCronAt || null,
        lastDeliverAt: lastDeliverAt || null,
        confirmed, pending,
      });
    }

    // 手動配信レバー(復旧・監視エージェント用)。ADMIN_KEY 未設定なら無効。
    if (url.pathname === "/api/admin/deliver") {
      if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
        return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      const result = await deliver(env, { force: url.searchParams.get("force") === "1" });
      return Response.json({ ok: true, result });
    }

    // それ以外は静的アセットにフォールバック
    return env.ASSETS.fetch(request);
  },

  // 毎朝の配信(cron)。新しい号が出ていたら、まだ受け取っていない confirmed 読者へ配信する。
  // 冪等: 同じ号は二重送信しない。複数回発火しても安全(取りこぼしに強い)。
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      // ハートビート: cron が発火したこと自体を記録(発火していないことを外から検知できる)
      try { await env.SUBSCRIBERS?.put("__meta_last_cron_at", new Date().toISOString()); }
      catch (e) { console.log("heartbeat failed", String(e).slice(0, 80)); }
      await deliver(env);
    })());
  },
};

async function deliver(env, opts = {}) {
  const force = !!opts.force;
  if (!configured(env)) { console.log("deliver: not configured, skip"); return { ok: false, reason: "not_configured" }; }
  await env.SUBSCRIBERS.put("__meta_last_deliver_at", new Date().toISOString());
  // 自分の静的アセットから最新号を読む
  const res = await env.ASSETS.fetch(new Request(SITE_URL + "/content/trends.json"));
  if (!res.ok) { console.log("deliver: trends.json fetch failed", res.status); return { ok: false, reason: "trends_fetch_failed", status: res.status }; }
  const trends = await res.json();
  const issue = trends.issues && trends.issues[0];
  if (!issue) return { ok: false, reason: "no_issue" };

  const last = await env.SUBSCRIBERS.get("__meta_last_sent");
  if (!force && last === issue.version) { console.log("deliver: already fully sent", issue.version); return { ok: true, reason: "already_sent", version: issue.version, sent: 0 }; }

  // 確定済みで「この号をまだ受け取っていない」読者だけを集める(受信者ごとに既読管理=重複送信しない)
  const targets = [];
  let cursor;
  do {
    const l = await env.SUBSCRIBERS.list({ cursor });
    for (const k of l.keys) {
      if (k.name.startsWith("__meta")) continue;
      const rec = JSON.parse((await env.SUBSCRIBERS.get(k.name)) || "null");
      if (rec && rec.status === "confirmed" && rec.token && (force || rec.lastSentVer !== issue.version)) {
        targets.push({ email: k.name, rec });
      }
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);

  if (targets.length === 0) {
    await env.SUBSCRIBERS.put("__meta_last_sent", issue.version);
    console.log("deliver: no pending recipients for", issue.version);
    return { ok: true, reason: "no_pending", version: issue.version, sent: 0 };
  }

  const bodyBase =
    `${issue.headline}\n${issue.date}\n\n` +
    issue.items.map((it, i) =>
      `${i + 1}. ${plain(it.title)}\n${plain(it.lead)}\n`).join("\n") +
    `\nすべて読む: ${SITE_URL}/#/trends\n`;

  let sent = 0, failed = 0;
  for (const t of targets) {
    const unsub = `${SITE_URL}/api/unsubscribe?e=${encodeURIComponent(t.email)}&t=${t.rec.token}`;
    try {
      await sendMail(env, t.email,
        `[${SITE_NAME}] ${issue.headline}(${issue.version})`,
        bodyBase + `\n—\n配信の解除はこちら: ${unsub}\n`);
      t.rec.lastSentVer = issue.version; // 送れた人だけ既読化(失敗した人は次回の対象に残る)
      await env.SUBSCRIBERS.put(t.email, JSON.stringify(t.rec));
      sent++;
    } catch (e) { failed++; console.log("deliver: send failed", t.email.slice(0, 3) + "***", String(e).slice(0, 120)); }
  }
  // 全員に送れたときだけ号を「配信完了」にする。失敗が残れば完了扱いにせず、次回の発火で残りを再送。
  if (failed === 0) await env.SUBSCRIBERS.put("__meta_last_sent", issue.version);
  console.log(`deliver: ${issue.version} sent=${sent} failed=${failed}`);
  return { ok: failed === 0, version: issue.version, sent, failed };
}
