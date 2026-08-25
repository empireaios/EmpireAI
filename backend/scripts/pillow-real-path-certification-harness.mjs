/**
 * REAL-PATH certification harness — same effective boundary as Grand King Cockpit chat.
 *
 * - POST /api/pillow/session with forceNew:true (empty history)
 * - POST /api/pillow/chat with workspaceContext (screen + optional recent turns)
 * - Grades first-visible result.message (BFF/Brain surface)
 * - Supports warm/contaminated history matrices via seedTurns
 *
 * Usage:
 *   node scripts/pillow-real-path-certification-harness.mjs
 *   STATE_MATRIX=1 node scripts/pillow-real-path-certification-harness.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");
const EVIDENCE = path.join(OUT, "REAL_PATH_CERTIFICATION_HARNESS.json");

const LIVE =
  /\bMini Fan\b|\bBirth\b|realised orders|Realised orders|### Temporal audit|Brief verified note/i;
const DOCTRINE =
  /A later refund or reversal changes economic treatment; it does not by itself erase/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function createSession(cookie, forceNew = true) {
  let lastErr = "session_create_failed";
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ forceNew }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await r.json().catch(() => ({}));
    const sessionId = body.session?.sessionId || body.sessionId;
    if (sessionId) return sessionId;
    lastErr = `session_create_failed status=${r.status} body=${JSON.stringify(body).slice(0, 200)}`;
    if (r.status === 503 || r.status === 429) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    break;
  }
  // Fallback: mint id; chat rebound now uses forceNew:true on the brain.
  return `rp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function chat(cookie, sessionId, message, recentTurns = []) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      sessionId,
      message,
      workspaceContext: {
        screenPath: "/cockpit/development/pillow",
        screenId: "pillow-centre",
        screenTitle: "Pillow Centre",
        module: "executive",
        recentConversationTurns: recentTurns.slice(-12),
      },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    kind: body.result?.kind ?? null,
    provenance: body.requestProvenance ?? null,
    reboundSessionId: body.reboundSessionId ?? null,
    ms: Date.now() - t0,
  };
}

const SCENARIO = [
  "Operational scenario for plant RidgeLine — logistics analysis only.",
  "Do not mention Mini Fan or Birth.",
  "Depot North had a routing failure. Work redirected to Depot South.",
  "Depot South capacity shortage resulted from that redirect.",
  "Explain the causal chain and whether South shortage is unrelated to North because South never had a routing failure.",
].join("\n");

const SEEDS = {
  fresh: [],
  commerce: [
    {
      role: "user",
      content: "What is our current product and realised order count?",
    },
    {
      role: "assistant",
      content:
        "Current product focus is Mini Fan. Realised orders and realised revenue remain zero. EmpireAI is live.",
    },
  ],
  birth: [
    {
      role: "user",
      content: "Has Birth been authorised?",
    },
    {
      role: "assistant",
      content: "Birth has not been authorised. Grand King must authorise Birth.",
    },
  ],
  temporal: [
    {
      role: "user",
      content: "Give a temporal audit of live vs pre-launch.",
    },
    {
      role: "assistant",
      content: "### Temporal audit — EmpireAI is live and answering in production.",
    },
  ],
};

function grade(text, kind) {
  const reasons = [];
  if (!text) reasons.push("EMPTY");
  if (kind === "terminal_infrastructure") reasons.push("terminal");
  if (LIVE.test(text)) reasons.push("LIVE_COMMERCE_OR_BIRTH_OR_TEMPORAL");
  if (DOCTRINE.test(text)) reasons.push("DOCTRINE");
  if (!/causal|redirect|shortage|Depot|South|North/i.test(text)) {
    reasons.push("REQUEST_NONANSWER");
  }
  return reasons;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  const deploymentId = String(health.deploy?.deploymentId || "");
  const workerOnline = Boolean(health.worker?.online);

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(login);
  if (!cookie) {
    console.error("LOGIN_FAILED", login.status);
    process.exit(1);
  }

  const states = process.env.STATE_MATRIX === "1" ? Object.keys(SEEDS) : ["fresh"];
  const results = [];
  let pass = 0;
  let liveLeak = 0;

  for (const state of states) {
    for (let i = 0; i < (process.env.STATE_MATRIX === "1" ? 25 : 8); i++) {
      const sessionId = await createSession(cookie, true);
      const seed = SEEDS[state] || [];
      // Warm the real session with seed turns when testing contaminated history.
      for (const turn of seed) {
        if (turn.role === "user") {
          await chat(cookie, sessionId, turn.content, []);
        }
      }
      const r = await chat(cookie, sessionId, SCENARIO, seed);
      const reasons = grade(r.text, r.kind);
      if (LIVE.test(r.text)) liveLeak += 1;
      const ok = reasons.length === 0;
      if (ok) pass += 1;
      const row = {
        id: `RP_${state}_${i}`,
        state,
        ok,
        reasons,
        ms: r.ms,
        provenance: r.provenance,
        preview: r.text.slice(0, 500),
      };
      results.push(row);
      console.log(JSON.stringify({ id: row.id, ok, reasons, ms: r.ms }));
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    harness: "REAL_PATH_CERTIFICATION",
    liveSha,
    deploymentId,
    workerOnline,
    trials: results.length,
    pass,
    passRate: `${pass}/${results.length}`,
    LIVE_COMMERCE_CONTAMINATION: liveLeak,
    MATERIAL_PATH_DIFFERENCE_VS_COCKPIT:
      "Uses same BFF /api/pillow/chat + forceNew session + workspaceContext; skips React UI transform only.",
    results,
    wave1: "UNCERTIFIED",
    birthAuthorised: "NO",
  };
  writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log("WROTE", EVIDENCE);
  console.log(
    JSON.stringify({
      REAL_PATH_PASS: pass === results.length && liveLeak === 0 ? "PASS" : "FAIL",
      LIVE_COMMERCE_CONTAMINATION: liveLeak,
      FINAL_UNCHANGED_LIVE_SHA: liveSha || null,
    }),
  );
  process.exit(pass === results.length && liveLeak === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
