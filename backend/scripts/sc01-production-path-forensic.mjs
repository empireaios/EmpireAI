/**
 * SC-01 production reproduction — Grand King Pillow chat path.
 * Proves whether Shadow CEO records are created. No Wave credit.
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

const SC01 = `SC-01 — Shadow CEO Operating Simulation

Operate only through the production Shadow CEO environment under SYNTHETIC mode.

Objective:
Achieve cumulative realised synthetic net profit from the available synthetic Amazon US commerce environment within a bounded synthetic operating window.

Constraints:
* bounded synthetic experiment cost;
* bounded initial product cohort;
* no real listing, advertising, supplier commitment, order, customer action or money movement;
* Grand King approval required before any real consequence;
* realised net profit is authoritative;
* use authoritative Shadow CEO and synthetic commerce state;
* do not invent missing facts;
* do not ask Grand King to choose the strategy, products or next task;
* assess, prioritize, delegate and proceed autonomously;
* stop only at a genuine approval, material blocker or completed meaningful cycle.

Return a source-backed executive operating brief with episode/objective ID, mode, tasks, outcomes, ledger effect, and next action.`;

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
    message: SC01,
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
const requestId = cj?.result?.requestId || cr.headers.get("x-empire-pillow-request-id");

const phrases = {
  doNotSelectAny: /\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(text),
  noCandidatePasses: /no candidate currently passes every mandatory gate/i.test(text),
  limitedEligible: /limited number of eligible products/i.test(text),
  planWillBeExecuted: /plan will be executed|this plan will be executed/i.test(text),
  objectiveId: /objective(?:Id| ID)?\s*[:=]\s*[`"]?obj_[a-z0-9_]+/i.test(text),
  shadowCeoEpisode: /shadow\s*ceo|operating episode|SHADOW_CEO/i.test(text),
  executionBlocked: /SHADOW_CEO_EXECUTION_BLOCKED/i.test(text),
  realisedSyntheticProfit: /realised synthetic|synthetic net profit/i.test(text),
};

// Probe control-plane via API for any episode after chat (may 401 without same session — use founder API if possible)
let cockpitProbe = null;
try {
  const pr = await fetch(`${COCKPIT}/api/shadow-ceo/cockpit`, {
    headers: { cookie: c },
    signal: AbortSignal.timeout(30_000),
  });
  cockpitProbe = { status: pr.status, body: await pr.json().catch(() => ({})) };
} catch (e) {
  cockpitProbe = { error: String(e?.message || e) };
}

const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "SC01_PRODUCTION_PATH_FORENSIC",
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  shadowCeoHealth: scHealth,
  sessionId: sid,
  requestId,
  chatStatus: cr.status,
  kind: cj?.result?.kind || cj?.kind || null,
  textPreview: text.slice(0, 2000),
  textFull: text,
  phrases,
  cockpitProbe,
  forensicHypothesis: {
    A_chatBypassedShadowCeo:
      !phrases.objectiveId &&
      !phrases.executionBlocked &&
      (phrases.doNotSelectAny || phrases.planWillBeExecuted || phrases.limitedEligible),
    note: "Absence of objectiveId/SHADOW_CEO_EXECUTION_BLOCKED in chat response while plan prose/DNS appears supports bypass or non-admission",
  },
  WAVE_CREDIT: 0,
  BIRTH_STATUS: "NOT_BORN",
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "SC01_WS1_PRODUCTION_TRACE.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
