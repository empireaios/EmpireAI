import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = "C:/Users/erlan/OneDrive/Desktop/EmpireAI";
for (const line of readFileSync(path.join(ROOT, "backend/.env"), "utf8").split(/\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
}
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
const rid = process.argv[2] || "pcr_b68d784df3564761";

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
const rr = await fetch(`${COCKPIT}/api/pillow/chat-request/${encodeURIComponent(rid)}`, {
  headers: { cookie: c },
  signal: AbortSignal.timeout(60_000),
});
const jj = await rr.json().catch(() => ({}));
const out = {
  http: rr.status,
  keys: Object.keys(jj || {}),
  resultKeys: jj?.result ? Object.keys(jj.result) : [],
  kind: jj?.result?.kind || jj?.kind || null,
  requestId: jj?.result?.requestId || jj?.requestId || null,
  messageHead: String(jj?.result?.message || jj?.message || jj?.result?.text || "").slice(0, 300),
  status: jj?.result?.status || jj?.status || null,
};
writeFileSync(new URL("./_probe_retrieve.json", import.meta.url), JSON.stringify({ out, raw: jj }, null, 2));
console.log(JSON.stringify(out));
