/**
 * Live durable chat delivery smoke — engineering verification only.
 * Does not award Wave/Birth credit. Does not set ARCHITECTURE_READY_EXTERNAL.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/PILLOW_DURABLE_RESUME_PROD_SMOKE.json",
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

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const health = await (await fetch(`${BRAIN}/health/live`)).json().catch(() => ({}));
const healthFull = await (await fetch(`${BRAIN}/health`)).json().catch(() => ({}));

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
    message: "Say only: DURABLE_OK",
    workspaceContext: {
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
      recentConversationTurns: [],
    },
  }),
  signal: AbortSignal.timeout(180_000),
});
const cj = await cr.json().catch(() => ({}));
const rid =
  cj?.result?.requestId ||
  cj?.requestId ||
  cr.headers.get("x-empire-pillow-request-id");
const kind = cj?.result?.kind || cj?.kind;
const msg = String(cj?.result?.message || cj?.message || "");

let getStatus = null;
let getBody = null;
if (rid) {
  const gr = await fetch(`${COCKPIT}/api/pillow/chat-request/${encodeURIComponent(rid)}`, {
    headers: { cookie: c },
    signal: AbortSignal.timeout(30_000),
  });
  getStatus = gr.status;
  getBody = await gr.json().catch(() => ({}));
}

const getReq = getBody?.request || null;
const acceptOk = Boolean(rid && String(rid).startsWith("pcr_"));
const getOk = getStatus === 200 && Boolean(getReq);
const completed =
  getReq?.status === "COMPLETED" &&
  Boolean(getReq?.finalResult || getReq?.brainResult);
const failurePersisted =
  (getReq?.status === "FAILED_FATAL" || getReq?.status === "FAILED") &&
  Boolean(getReq?.failureClass);
const engineeringPass =
  acceptOk &&
  getOk &&
  cr.status >= 200 &&
  cr.status < 500 &&
  (completed || failurePersisted);

const out = {
  generatedAt: new Date().toISOString(),
  MISSION_TYPE: "DURABLE_CHAT_DELIVERY_ARCHITECTURE",
  NOTE: "Resume verification smoke — not external architecture confirmation",
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  workerOnline: Boolean(health?.worker?.online),
  redisMode: healthFull?.redisMode ?? null,
  chatHttp: cr.status,
  kind,
  requestId: rid,
  msgPreview: msg.slice(0, 240),
  getStatus,
  getRequestStatus: getReq?.status ?? null,
  getFailureClass: getReq?.failureClass ?? null,
  getHasFinal: Boolean(getReq?.finalResult || getReq?.brainResult),
  durableFlag: Boolean(cj?.result?.durableRequest || cj?.result?.durableRetrieved),
  acceptOk,
  getOk,
  completedPath: completed,
  failurePersistedPath: failurePersisted,
  ENGINEERING_SMOKE_PASS: engineeringPass,
  ARCHITECTURE_READY_EXTERNAL: "UNCONFIRMED",
  WAVE_CREDIT: 0,
  BIRTH_AUTHORISED: "NO",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(engineeringPass ? 0 : 1);
