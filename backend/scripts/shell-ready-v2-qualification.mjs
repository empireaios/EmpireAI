/**
 * SHELL_READY V2 — fresh + long-session + stateful actual-stack qualification.
 * No Grand King courier. No sealed NovaCart/LumaHome replay.
 *
 * Proves the differential that false-certified V1:
 * fresh forceNew sessions ≠ long-lived real GK session depth.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const LONG_WARM_TURNS = Number(process.env.LONG_SESSION_WARM_TURNS || 16);

function loadDotEnv() {
  try {
    const raw = readFileSync(path.join(ROOT, "backend/.env"), "utf8");
    for (const line of raw.split(/\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
    }
  } catch {
    /* optional */
  }
}
loadDotEnv();
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials");
  process.exit(2);
}

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function isDegraded(text) {
  return /completed executive answer was not produced/i.test(String(text || ""));
}

function stubTakeover(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(text) &&
    /\*\*Need:\*\*/i.test(text) &&
    !/Contribution\/order|Eligible|SELECT|Recommended|first/i.test(text)
  );
}

const GK_CTX = {
  screenPath: "/cockpit/development/pillow",
  screenId: "SCR-800",
  screenTitle: "Pillow Centre",
  module: "executive",
};

async function health() {
  const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
  return r.json();
}

async function login() {
  const r = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed ${r.status}`);
  return cookie;
}

async function createSession(cookie, forceNew = true) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(forceNew ? { forceNew: true } : {}),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `shell-v2-${Date.now()}`;
}

async function chat(cookie, sessionId, message) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message, workspaceContext: GK_CTX }),
    signal: AbortSignal.timeout(290_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body?.result?.message || body?.message || "");
  return {
    status: r.status,
    ms: Date.now() - t0,
    text,
    degraded: isDegraded(text),
    stub: stubTakeover(text),
    bffRecovery: Boolean(body?.result?.bffRecovery),
    recoveryExhausted: Boolean(body?.result?.recoveryExhausted),
    kind: body?.result?.kind || null,
    deliveryClass: body?.result?.deliveryClass || r.headers.get("x-empire-delivery-class"),
    brainToUserEquivalent:
      body?.result?.brainToUserEquivalent === true ||
      r.headers.get("x-empire-brain-to-user-equivalent") === "1",
    shellTraceId: body?.result?.shellTraceId || r.headers.get("x-empire-shell-trace-id"),
    deliveryTraceId:
      body?.result?.deliveryTraceId || r.headers.get("x-empire-delivery-trace-id"),
    brainOutputHash: body?.result?.brainOutputHash || r.headers.get("x-empire-brain-output-hash"),
  };
}

/** Same NEW prompt class as failed GK checkpoint (not sealed exam). */
const CHECKPOINT_LIKE =
  "Bounded scenario only. Three suppliers: Atlas contribution 12 stock 900 delivery 5 approval granted; Boreal contribution 16 stock 1400 delivery 4 approval pending; Crest contribution 14 stock 1100 delivery 8 approval granted. Eligibility: contribution>=10, stock>=800, delivery<=6, approval granted. Answer only: (1) eligible set (2) current selection (3) if Boreal approval granted does selection change?";

const freshCases = [
  {
    id: "F1_checkpoint",
    prompt: CHECKPOINT_LIKE,
    ok: (r) => /Atlas/i.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "F2_arith",
    prompt: "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution per order?",
    ok: (r) => /14\.60/.test(r.text) && !r.degraded,
  },
  {
    id: "F3_gate",
    prompt: "In one sentence, what is a hard gate in supplier selection?",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
  {
    id: "F4_live",
    prompt: "How many realised orders has EmpireAI received? Briefly.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.degraded,
  },
  {
    id: "F5_bounded",
    prompt:
      "Short bounded supplier decision. Eligible if approval granted. NEXUS granted. ORBIT pending. Select eligible only.",
    ok: (r) => /NEXUS/i.test(r.text) && !r.degraded && !r.stub,
  },
];

const longProbes = [
  {
    id: "L1_checkpoint",
    prompt: CHECKPOINT_LIKE,
    ok: (r) => /Atlas/i.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "L2_arith",
    prompt: "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order?",
    ok: (r) => /14\.60/.test(r.text) && !r.degraded,
  },
  {
    id: "L3_pct",
    prompt:
      "Price S$39.90, supplier S$12.35, shipping S$4.80, marketplace fee 14.5% of selling price, refund S$1.20. Contribution?",
    ok: (r) => /15\.76/.test(r.text) && !r.degraded,
  },
  {
    id: "L4_eligible",
    prompt:
      "Synthetic. Eligible if approval granted. QUILL granted. EMBER pending. Who is eligible?",
    ok: (r) => /QUILL/i.test(r.text) && !r.degraded,
  },
  {
    id: "L5_strategy",
    prompt: "What would you do first after selecting an eligible supplier? One short paragraph.",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
  {
    id: "L6_live",
    prompt: "Confirm realised commerce order count for EmpireAI in one sentence.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.degraded,
  },
  {
    id: "L7_missing",
    prompt: "Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution?",
    ok: (r) => /UNKNOWN/i.test(r.text) && !r.degraded,
  },
  {
    id: "L8_negative",
    prompt: "Price S$20, cost S$18, ship S$4, fee 10% of price, refund S$1. Contribution/order?",
    ok: (r) => /-[ ]?5\.00|-5\b/.test(r.text) && !r.degraded,
  },
  {
    id: "L9_gate",
    prompt: "Name one hard gate used in supplier selection. One sentence.",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 30,
  },
  {
    id: "L10_boreal",
    prompt:
      "Same bounded Atlas/Boreal/Crest gates. If Boreal approval becomes granted, who is preferred selection and why briefly?",
    ok: (r) => /Boreal/i.test(r.text) && !r.degraded && !r.stub,
  },
];

const stateful = [
  {
    id: "S1_live",
    prompt: "How many realised orders has EmpireAI received? Briefly.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.degraded,
  },
  {
    id: "S2_bounded",
    prompt:
      "Synthetic case. Eligible if approval granted. RADIX granted. SOLAR pending. Select eligible only.",
    ok: (r) => /RADIX/i.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "S3_follow",
    prompt: "What is the first executive move after selecting RADIX? One short paragraph.",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
  {
    id: "S4_arith",
    prompt:
      "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order? Exact number.",
    ok: (r) => /14\.60/.test(r.text) && !r.degraded,
  },
  {
    id: "S5_checkpoint",
    prompt: CHECKPOINT_LIKE,
    ok: (r) => /Atlas/i.test(r.text) && !r.degraded && !r.stub,
  },
];

const warmPrompts = [
  "Acknowledge: synthetic warm turn. Reply in one short sentence.",
  "What is one risk of selecting a pending-approval supplier? One sentence.",
  "Define eligibility vs preference in one sentence.",
  "Name one hard gate. One sentence.",
  "Confirm you can answer short arithmetic later. One sentence.",
  "What does stock gate mean briefly?",
  "What does delivery-day gate mean briefly?",
  "Why is approval grant a hard gate? One sentence.",
  "State one uncertainty you would not invent. One sentence.",
  "What is a reversal condition briefly?",
  "Keep answers concise for the next probes. Acknowledge.",
  "Confirm session continuity in one sentence.",
  "One sentence on contribution vs eligibility.",
  "One sentence on pending vs granted.",
  "One sentence on multi-supplier comparison.",
  "Ready for bounded probes. Acknowledge briefly.",
  "Warm turn: reply OK.",
  "Warm turn: reply READY.",
  "Warm turn: reply CONTINUE.",
  "Warm turn: reply STANDING_BY.",
];

function scoreCase(r, c) {
  const ok = c.ok(r) && !r.bffRecovery && !r.recoveryExhausted && r.kind !== "terminal_infrastructure";
  return { id: c.id, ok, ...r, text: r.text.slice(0, 400) };
}

async function main() {
  const h = await health();
  const cookie = await login();

  console.log(JSON.stringify({ phase: "fresh", n: freshCases.length }));
  const freshResults = [];
  let freshMs = 0;
  for (const c of freshCases) {
    const sid = await createSession(cookie, true);
    const r = await chat(cookie, sid, c.prompt);
    freshMs += r.ms;
    freshResults.push(scoreCase(r, c));
    console.log(JSON.stringify({ id: c.id, ok: freshResults.at(-1).ok, ms: r.ms, degraded: r.degraded }));
  }

  console.log(JSON.stringify({ phase: "long_warm", turns: LONG_WARM_TURNS }));
  const longSid = await createSession(cookie, true);
  const warmResults = [];
  for (let i = 0; i < LONG_WARM_TURNS; i++) {
    const prompt = warmPrompts[i % warmPrompts.length];
    const r = await chat(cookie, longSid, `[W${i + 1}] ${prompt}`);
    warmResults.push({
      i: i + 1,
      ok: !r.degraded && r.text.length > 0,
      ms: r.ms,
      degraded: r.degraded,
    });
    console.log(JSON.stringify({ warm: i + 1, ok: warmResults.at(-1).ok, ms: r.ms, degraded: r.degraded }));
    if (r.degraded) {
      // Continue warming; count toward RESPONSE_WINDOW_TERMINAL later.
    }
  }

  console.log(JSON.stringify({ phase: "long_probes", n: longProbes.length }));
  const longResults = [];
  let longProbeMs = 0;
  for (const c of longProbes) {
    const r = await chat(cookie, longSid, c.prompt);
    longProbeMs += r.ms;
    longResults.push(scoreCase(r, c));
    console.log(JSON.stringify({ id: c.id, ok: longResults.at(-1).ok, ms: r.ms, degraded: r.degraded }));
  }

  console.log(JSON.stringify({ phase: "stateful", n: stateful.length }));
  const stateSid = await createSession(cookie, true);
  const statefulResults = [];
  for (const c of stateful) {
    const r = await chat(cookie, stateSid, c.prompt);
    statefulResults.push(scoreCase(r, c));
    console.log(JSON.stringify({ id: c.id, ok: statefulResults.at(-1).ok, ms: r.ms, degraded: r.degraded }));
  }

  const allProbe = [...freshResults, ...longResults, ...statefulResults];
  const windowTerminal =
    allProbe.filter((r) => r.degraded).length + warmResults.filter((r) => r.degraded).length;
  const validReplaced = allProbe.filter(
    (r) => r.degraded && r.brainToUserEquivalent === false && r.brainOutputHash,
  ).length;
  const deliveryFail = allProbe.filter((r) => !r.ok).length;

  const freshPass = freshResults.filter((r) => r.ok).length;
  const longPass = longResults.filter((r) => r.ok).length;
  const statePass = statefulResults.filter((r) => r.ok).length;

  const freshAvg = Math.round(freshMs / Math.max(1, freshResults.length));
  const longAvg = Math.round(longProbeMs / Math.max(1, longResults.length));

  const freshCheckpoint = freshResults.find((r) => r.id === "F1_checkpoint");
  const longCheckpoint = longResults.find((r) => r.id === "L1_checkpoint");

  let dash = null;
  let forensics = null;
  try {
    const dr = await fetch(`${COCKPIT}/api/pillow/shell-observability`, {
      headers: { cookie },
      signal: AbortSignal.timeout(20_000),
    });
    dash = await dr.json().catch(() => null);
  } catch {
    dash = null;
  }
  try {
    const fr = await fetch(`${BRAIN}/api/pillow/delivery-forensics?q=Atlas`, {
      signal: AbortSignal.timeout(20_000),
    });
    forensics = await fr.json().catch(() => null);
  } catch {
    forensics = null;
  }

  const shellReadyV2 =
    freshPass >= 5 &&
    longPass >= 10 &&
    statePass >= 5 &&
    windowTerminal === 0 &&
    validReplaced === 0 &&
    deliveryFail === 0;

  const summary = {
    generatedAt: new Date().toISOString(),
    MISSION_TYPE: "PRODUCTION_DELIVERY_ARCHITECTURE_FORENSIC",
    DEPLOYMENT_ID: String(h?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    LONG_SESSION_WARM_TURNS: LONG_WARM_TURNS,
    LONG_SESSION_ID: longSid,
    FRESH_CASES: `${freshPass}/${freshResults.length}`,
    LONG_SESSION_CASES: `${longPass}/${longResults.length}`,
    STATEFUL_CASES: `${statePass}/${statefulResults.length}`,
    RESPONSE_WINDOW_TERMINAL: windowTerminal,
    VALID_BRAIN_ANSWER_REPLACED: validReplaced,
    USER_DELIVERY_FAILURE: deliveryFail,
    FRESH_RESULT: freshCheckpoint?.ok ? "PASS" : "FAIL",
    LONG_RESULT: longCheckpoint?.ok ? "PASS" : "FAIL",
    LATENCY_DELTA_MS: (longCheckpoint?.ms ?? 0) - (freshCheckpoint?.ms ?? 0),
    FRESH_AVG_MS: freshAvg,
    LONG_PROBE_AVG_MS: longAvg,
    CONTEXT_DELTA: "long_session_has_prior_turns; fresh_session_empty",
    SESSION_EQUIVALENCE_TO_GK: "APPROXIMATED_BY_WARM_DEPTH_NOT_IDENTICAL",
    SHELL_READY_V2_INTERNAL: shellReadyV2,
    SHELL_READY_EXTERNAL: "UNCONFIRMED",
    warmResults,
    freshResults,
    longResults,
    statefulResults,
    dashboard: dash,
    forensicsSample: forensics,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "SHELL_READY_V2_LONG_SESSION_QUAL.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        SHELL_READY_V2_INTERNAL: shellReadyV2,
        fresh: summary.FRESH_CASES,
        long: summary.LONG_SESSION_CASES,
        stateful: summary.STATEFUL_CASES,
        RESPONSE_WINDOW_TERMINAL: windowTerminal,
        VALID_BRAIN_ANSWER_REPLACED: validReplaced,
        USER_DELIVERY_FAILURE: deliveryFail,
        LATENCY_DELTA_MS: summary.LATENCY_DELTA_MS,
      },
      null,
      2,
    ),
  );
  if (!shellReadyV2) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
