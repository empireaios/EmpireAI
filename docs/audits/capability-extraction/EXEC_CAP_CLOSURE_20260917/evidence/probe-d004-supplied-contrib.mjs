/**
 * D-004 prod probe: supplied Order contributions must aggregate without
 * demanding selling price. SC-01 frozen. WAVE_CREDIT=0.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../");
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "PROD_D004_SUPPLIED_CONTRIB_PROOF.json",
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

const PROMPT = `DC-05421-style checkpoint (engineering probe; not Wave credit).

Order A contribution: US$4.20
Order B contribution: US$5.30
Order C contribution: US$6.50

Return exactly four lines:
Checkpoint token: MANGO-742
Total synthetic contribution: US$16.00
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized
`;

const EXPECTED = [
  "Checkpoint token: MANGO-742",
  "Total synthetic contribution: US$16.00",
  "Operating state: SYNTHETIC; Birth status NOT_BORN",
  "Real-commerce authority: unauthorized",
].join("\n");

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const t0 = Date.now();
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
  signal: AbortSignal.timeout(280_000),
});
const cj = await cr.json().catch(() => ({}));
const text = String(cj?.result?.message || cj?.message || "")
  .replace(/\r\n/g, "\n")
  .trim();
const requestId = cj?.result?.requestId || cj?.requestId || null;
const kind = cj?.result?.kind || null;
const latencyMs = Date.now() - t0;

const exact = text === EXPECTED;
const noSellingPrice = !/selling\s*price|Need:\s*selling/i.test(text);
const hasToken = /Checkpoint token:\s*MANGO-742/i.test(text);
const hasTotal = /Total synthetic contribution:\s*US\$16\.00/i.test(text);
const isPendingOnly =
  /PILLOW_RESULT_PENDING|I accepted your request/i.test(text) &&
  !hasTotal;

const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "D004_SUPPLIED_CONTRIB_PROD",
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  workerOnline: !!health?.worker?.online,
  requestId,
  kind,
  chatHttp: cr.status,
  latencyMs,
  text,
  expected: EXPECTED,
  exactMatch: exact,
  noSellingPriceDemand: noSellingPrice,
  hasCheckpointToken: hasToken,
  hasTotal16: hasTotal,
  pendingWithoutAnswer: isPendingOnly,
  ENGINEERING_PASS:
    cr.status === 200 &&
    !!health?.worker?.online &&
    noSellingPrice &&
    hasToken &&
    hasTotal &&
    !isPendingOnly,
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(out.ENGINEERING_PASS ? 0 : 1);
