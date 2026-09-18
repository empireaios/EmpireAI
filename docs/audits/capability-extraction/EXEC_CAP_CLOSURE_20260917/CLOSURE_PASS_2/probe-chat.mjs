import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");
for (const line of readFileSync(path.join(ROOT, "backend/.env"), "utf8").split(/\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const lr = await fetch(`${COCKPIT}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const c = cookie(lr);
const out = { login: lr.status, hasCookie: Boolean(c) };
if (!c) {
  console.log(JSON.stringify(out));
  process.exit(1);
}
const sr = await fetch(`${COCKPIT}/api/pillow/session`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({ forceNew: true }),
  signal: AbortSignal.timeout(60_000),
});
const sj = await sr.json().catch(() => ({}));
out.sessionHttp = sr.status;
out.sessionId = sj.session?.sessionId || sj.sessionId || null;
if (!out.sessionId) {
  out.sessionBody = sj;
  console.log(JSON.stringify(out));
  process.exit(1);
}
const t0 = Date.now();
const cr = await fetch(`${COCKPIT}/api/pillow/chat`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({
    sessionId: out.sessionId,
    message: "SOAK_PROBE SYNTHETIC. Birth status and 9+10? One short reply.",
    workspaceContext: {
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
    },
  }),
  signal: AbortSignal.timeout(280_000),
});
const cj = await cr.json().catch(() => ({}));
out.chatHttp = cr.status;
out.latencyMs = Date.now() - t0;
out.kind = cj?.result?.kind || null;
out.requestId = cj?.result?.requestId || cj?.requestId || null;
out.head = String(cj?.result?.message || cj?.message || "").slice(0, 240);
console.log(JSON.stringify(out, null, 2));
writeFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "probe-chat.json"),
  JSON.stringify(out, null, 2),
);
