/**
 * Post-integration production probe — proves Grand King chat admits Shadow CEO.
 * Engineering evidence only. Does not award SC-01 / Birth / Wave credit.
 * Does not claim the original failed SC-01 episode is resumed/certified.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";

try {
  for (const line of readFileSync(path.join(ROOT, "backend/.env"), "utf8").split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
} catch {}

const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials");
  process.exit(2);
}

const MSG = `Integration verification — operate through the Shadow CEO environment under SYNTHETIC mode.

Assess authoritative synthetic Amazon US commerce state, prioritize, delegate tasks, execute only authorized synthetic actions, and return a source-backed executive brief with objective ID, mode, tasks, outcomes, ledger effect, and next action.

Do not invent missing facts. Do not ask Grand King to choose the strategy. Real commerce remains locked.`;

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const health = await (await fetch(`${BRAIN}/health/live`)).json().catch(() => ({}));
const scHealth = await (await fetch(`${BRAIN}/health/shadow-ceo`)).json().catch(() => ({}));

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
    message: MSG,
    workspaceContext: {
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
    },
  }),
  signal: AbortSignal.timeout(290_000),
});
const cj = await cr.json().catch(() => ({}));
const text = String(cj?.result?.message || cj?.message || "");
const requestId = cj?.result?.requestId || cj?.requestId || null;
const kind = cj?.result?.kind || cj?.kind || null;
const shadowCeoMeta = cj?.result?.shadowCeo || cj?.shadowCeo || null;

const objMatch = text.match(/obj_[a-z0-9_]+/i);
const objectiveId = shadowCeoMeta?.objectiveId || (objMatch ? objMatch[0] : null);

const phrases = {
  sourceBackedBrief: /Shadow CEO Executive Brief \(source-backed\)/i.test(text),
  doNotSelectAny: /\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(text),
  executionBlocked: /SHADOW_CEO_EXECUTION_BLOCKED/i.test(text),
  objectiveIdPresent: Boolean(objectiveId),
  syntheticMode: /Operating mode:.*SYNTHETIC|mode.*SYNTHETIC/i.test(text),
};

let cockpitById = null;
let cockpitList = null;
try {
  const list = await fetch(`${COCKPIT}/api/shadow-ceo/cockpit`, {
    headers: { cookie: c },
    signal: AbortSignal.timeout(60_000),
  });
  cockpitList = { status: list.status, body: await list.json().catch(() => ({})) };
} catch (e) {
  cockpitList = { error: String(e?.message || e) };
}
if (objectiveId) {
  try {
    const pr = await fetch(
      `${COCKPIT}/api/shadow-ceo/cockpit?objectiveId=${encodeURIComponent(objectiveId)}`,
      { headers: { cookie: c }, signal: AbortSignal.timeout(60_000) },
    );
    cockpitById = { status: pr.status, body: await pr.json().catch(() => ({})) };
  } catch (e) {
    cockpitById = { error: String(e?.message || e) };
  }
}

const chain = cockpitById?.body?.chain || null;
const parity =
  Boolean(objectiveId) &&
  chain?.objective?.id === objectiveId &&
  phrases.sourceBackedBrief &&
  !phrases.doNotSelectAny &&
  (kind === "shadow_ceo_episode" || phrases.sourceBackedBrief);

const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "SC01_POST_INTEGRATION_PRODUCTION_PROBE",
  NOTE: "Engineering path proof only — not SC-01 certification resume; not Birth/Wave credit",
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  shadowCeoHealth: scHealth,
  sessionId: sid,
  requestId,
  chatStatus: cr.status,
  kind,
  shadowCeoMeta,
  objectiveId,
  phrases,
  textPreview: text.slice(0, 2500),
  textFull: text,
  cockpitList,
  cockpitById: cockpitById
    ? {
        status: cockpitById.status,
        objectiveId: chain?.objective?.id ?? null,
        taskCount: chain?.tasks?.length ?? null,
        actionStatuses: chain?.actions?.map((a) => a.executionStatus) ?? null,
        hasBrief: Boolean(chain?.brief),
        hasLesson: Boolean(chain?.lesson),
      }
    : null,
  GATES: {
    G2_chatAdmission: kind === "shadow_ceo_episode" || phrases.sourceBackedBrief,
    G3_sourceBacked: Boolean(chain?.brief) && Boolean(chain?.outcome),
    G4_noPlanAsExecution: !phrases.doNotSelectAny && phrases.sourceBackedBrief,
    G6_cockpitParity: parity,
  },
  ENGINEERING_PATH_PASS: parity,
  WAVE_CREDIT: 0,
  BIRTH_STATUS: "NOT_BORN",
};

mkdirSync(OUT, { recursive: true });
writeFileSync(
  path.join(OUT, "SC01_POST_INTEGRATION_PROD_PROBE.json"),
  JSON.stringify(out, null, 2),
);
console.log(
  JSON.stringify(
    {
      wrote: "SC01_POST_INTEGRATION_PROD_PROBE.json",
      sha: out.RUNNING_SHA,
      deploymentId: out.DEPLOYMENT_ID,
      kind,
      objectiveId,
      ENGINEERING_PATH_PASS: out.ENGINEERING_PATH_PASS,
      GATES: out.GATES,
      preview: text.slice(0, 400),
    },
    null,
    2,
  ),
);
process.exit(out.ENGINEERING_PATH_PASS ? 0 : 1);
