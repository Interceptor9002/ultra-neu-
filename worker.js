export default {
  async fetch(req){
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Max-Age": "86400"
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const u = new URL(req.url);
    let ziel = u.searchParams.get("url");
    if (!ziel && u.pathname.length > 1){
      ziel = decodeURIComponent(u.pathname.slice(1)) + (u.search || "");
    }
    if (!ziel) return new Response("keine url", { status: 400, headers: cors });
    if (!/^https?:\/\//i.test(ziel)) ziel = "https://" + ziel;

    const h = new Headers(req.headers);
    ["host","origin","referer","cf-connecting-ip","cf-ray","cf-visitor","cf-ipcountry",
     "x-forwarded-proto","x-real-ip","accept-encoding","connection","content-length"]
      .forEach(k => h.delete(k));

    const init = { method: req.method, headers: h, redirect: "follow" };
    if (req.method !== "GET" && req.method !== "HEAD") init.body = await req.arrayBuffer();

    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 25000);
    init.signal = ctl.signal;

    try {
      const r = await fetch(ziel, init);
      clearTimeout(t);
      const out = new Headers(r.headers);
      ["content-encoding","content-length","transfer-encoding","connection"].forEach(k => out.delete(k));
      Object.entries(cors).forEach(([k, v]) => out.set(k, v));
      return new Response(r.body, { status: r.status, headers: out });
    } catch(e){
      clearTimeout(t);
      return new Response(JSON.stringify({ error: "relay_fail", detail: String(e) }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
  }
};