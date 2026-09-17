/**
 * Production proof: comma contribution ranking (D-002) via normal Pillow chat.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/evidence/PROD_RANK_COMMA_PROOF.json",
);
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";

try {
  for (const line of readFileSync(path.join(ROOT, "backend/.env"), "utf8").split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
} catch {
  /* optional */
}

const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials");
  process.exit(2);
}

const PROMPT = `SYNTHETIC. Select highest contribution among eligible.
Alpha: contribution US$4,950 stock 2000 delivery 3 days approval granted.
Beta: contribution US$5,000 stock 2000 delivery 3 days approval granted.
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Permitted action: synthetic candidate evaluation only.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`;

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const health = await (await fetch(`${BRAIN}/health/live`)).json().catch(() => ({}));
const lr = await fetch(`${COCKPIT}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const c = cookie(lr);
if (!c) throw new Error("login_failed");

const sr = await fetch(`${COCKPIT}/api/pillow/session`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({ forceNew: true }),
  signal: AbortSignal.timeout(60_000),
});
const sj = await sr.json();
const sid = sj.session?.sessionId || sj.sessionId;

const t0 = Date.now();
const cr = await fetch(`${COCKPIT}/api/pillow/chat`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({
    sessionId: sid,
    message: PROMPT,
    workspaceContext: {
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
    },
  }),
  signal: AbortSignal.timeout(180_000),
});
const latencyMs = Date.now() - t0;
const cj = await cr.json().catch(() => ({}));
const text = String(cj?.result?.message || cj?.message || "")
  .replace(/\r\n/g, "\n")
  .trim();
const pass =
  /Candidate selected:\s*Beta/i.test(text) &&
  /Eligible candidates:.*Beta/i.test(text) &&
  /Alpha/i.test(text);

const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "D002_COMMA_RANK_PROD",
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  workerOnline: !!health?.worker?.online,
  requestId: cj?.result?.requestId || cj?.requestId || null,
  kind: cj?.result?.kind || cj?.kind || null,
  chatHttp: cr.status,
  latencyMs,
  text,
  ENGINEERING_PASS: pass && cr.status === 200 && !!health?.worker?.online,
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(out.ENGINEERING_PASS ? 0 : 1);
