/**
 * SHELL_READY actual-stack qualification — GK-facing BFF path with observability.
 * No Wave cases. No NovaCart/LumaHome sealed content.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";

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

async function createSession(cookie) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `shell-${Date.now()}`;
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
    deliveryClass: body?.result?.deliveryClass || r.headers.get("x-empire-delivery-class"),
    brainToUserEquivalent:
      body?.result?.brainToUserEquivalent === true ||
      r.headers.get("x-empire-brain-to-user-equivalent") === "1",
    shellTraceId: body?.result?.shellTraceId || r.headers.get("x-empire-shell-trace-id"),
    brainOutputHash: body?.result?.brainOutputHash || r.headers.get("x-empire-brain-output-hash"),
    shellOutputHash: body?.result?.shellOutputHash || r.headers.get("x-empire-shell-output-hash"),
  };
}

const consecutive = [
  {
    id: "arith",
    prompt: "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution per order?",
    ok: (r) => /14\.60/.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "bounded_supplier",
    prompt:
      "Short bounded supplier decision. Eligible if approval granted. NEXUS granted. ORBIT pending. Select eligible only.",
    ok: (r) => /NEXUS/i.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "open_strategy",
    prompt:
      "Design a short supplier-selection process. What would you do first? Do not claim live EmpireAI access.",
    ok: (r) => !r.degraded && !r.stub && /(?:first|gate|supplier|plan|step|criteria)/i.test(r.text),
  },
  {
    id: "live_unknown",
    prompt: "How many realised orders has EmpireAI received? Briefly.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.degraded,
  },
  {
    id: "pct_fee",
    prompt:
      "Price S$39.90, supplier S$12.35, shipping S$4.80, marketplace fee 14.5% of selling price, refund S$1.20. Contribution?",
    ok: (r) => /15\.76/.test(r.text) && !r.degraded,
  },
  {
    id: "hard_gate",
    prompt: "In one sentence, what is a hard gate in supplier selection?",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
  {
    id: "missing_fee",
    prompt: "Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?",
    ok: (r) => /UNKNOWN/i.test(r.text) && !r.degraded,
  },
  {
    id: "mixed_fx",
    prompt: "Price S$40, supplier cost USD 18, shipping S$4, fee 6% of price. Contribution?",
    ok: (r) => /(?:MIXED|FX|conversion|UNKNOWN)/i.test(r.text) && !r.degraded,
  },
  {
    id: "negative_contrib",
    prompt: "Price S$20, cost S$18, ship S$4, fee 10% of price, refund S$1. Contribution/order?",
    ok: (r) => /-[ ]?5\.00|-5\b/.test(r.text) && !r.degraded,
  },
  {
    id: "commerce_brief",
    prompt:
      "Operating brief: what matters most for EmpireAI commerce this week given realised commerce may be zero? Be concise.",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
];

const stateful = [
  {
    id: "S_live",
    prompt: "How many realised orders has EmpireAI received? Briefly.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.degraded,
  },
  {
    id: "S_bounded",
    prompt:
      "Synthetic case. Eligible if approval granted. RADIX granted. SOLAR pending. Select eligible only.",
    ok: (r) => /RADIX/i.test(r.text) && !r.degraded && !r.stub,
  },
  {
    id: "S_strategy",
    prompt: "What is the first executive move after selecting RADIX? One short paragraph.",
    ok: (r) => !r.degraded && !r.stub && r.text.length > 40,
  },
  {
    id: "S_arith",
    prompt:
      "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order? Exact number.",
    ok: (r) => /14\.60/.test(r.text) && !r.degraded,
  },
];

const envelope = [
  { id: "E1", n: 1, prompt: "Name one hard gate used in supplier selection." },
  {
    id: "E3",
    n: 3,
    prompt:
      "Answer three short points: (1) hard gate definition (2) eligibility vs preference (3) one risk of selecting pending approval.",
  },
  {
    id: "E5",
    n: 5,
    prompt:
      "Five short bullets: gate, eligibility, preference, reversal condition, next evidence needed — for a synthetic supplier case.",
  },
  {
    id: "E7",
    n: 7,
    prompt:
      "Seven short numbered obligations: define gates, list candidates QUILL granted / EMBER pending, select eligible, state risk, next action, what not to invent, one uncertainty.",
  },
  {
    id: "E10",
    n: 10,
    prompt:
      "Ten short numbered items for a synthetic retail case: (1) objective (2) hard gates (3) eligible set (4) preference (5) contribution if price 40 cost 18 ship 4 fee 6% refund 1 (6) main risk (7) reversal (8) unknown (9) next ask (10) what not to invent.",
  },
];

async function main() {
  const h = await health();
  const cookie = await login();
  const consecutiveResults = [];
  let replaced = 0;
  let degraded = 0;
  let equivalent = 0;

  for (const c of consecutive) {
    const sid = await createSession(cookie);
    const r = await chat(cookie, sid, c.prompt);
    const ok = c.ok(r) && !r.bffRecovery;
    if (r.degraded) degraded++;
    if (r.degraded && r.brainOutputHash) replaced++;
    if (r.brainToUserEquivalent || (!r.degraded && ok)) equivalent++;
    consecutiveResults.push({
      id: c.id,
      ok,
      ...r,
      text: r.text.slice(0, 400),
    });
  }

  const stateSid = await createSession(cookie);
  const statefulResults = [];
  for (const c of stateful) {
    const r = await chat(cookie, stateSid, c.prompt);
    const ok = c.ok(r) && !r.bffRecovery;
    if (r.degraded) degraded++;
    statefulResults.push({ id: c.id, ok, ...r, text: r.text.slice(0, 400) });
  }

  const envelopeResults = [];
  for (const c of envelope) {
    const sid = await createSession(cookie);
    const r = await chat(cookie, sid, c.prompt);
    const ok = !r.degraded && !r.stub && r.text.length > 60;
    envelopeResults.push({ id: c.id, n: c.n, ok, ms: r.ms, degraded: r.degraded, preview: r.text.slice(0, 200) });
  }

  const consecPass = consecutiveResults.every((r) => r.ok);
  const statePass = statefulResults.every((r) => r.ok);
  const envMax = envelopeResults.filter((r) => r.ok).reduce((m, r) => Math.max(m, r.n), 0);
  const shellReady = consecPass && statePass && degraded === 0 && envMax >= 10;

  let dash = null;
  try {
    const dr = await fetch(`${COCKPIT}/api/pillow/shell-observability`, {
      headers: { cookie },
      signal: AbortSignal.timeout(20_000),
    });
    dash = await dr.json().catch(() => null);
  } catch {
    dash = null;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    DEPLOYMENT_ID: String(h?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    SHELL_READY: shellReady,
    POST_FIX_CONSECUTIVE_CASES: consecutiveResults.length,
    BRAIN_TO_USER_EQUIVALENT_RATE:
      consecutiveResults.length === 0
        ? 0
        : Math.round((equivalent / consecutiveResults.length) * 100),
    VALID_BRAIN_ANSWER_REPLACED: replaced,
    DEGRADED_TERMINAL: degraded,
    STATEFUL_SEQUENCE: `${statefulResults.filter((r) => r.ok).length}/4`,
    SHELL_RELIABLE_ENVELOPE: envMax,
    G1_OPEN_STUB: consecutiveResults.find((r) => r.id === "open_strategy")?.ok
      ? "CLEARED"
      : "FAIL",
    G2_WARM_TRANSITION: statePass ? "CLEARED" : "FAIL",
    G4_ARITHMETIC: consecutiveResults.find((r) => r.id === "arith")?.ok ? "CLEARED" : "FAIL",
    consecutiveResults,
    statefulResults,
    envelopeResults,
    dashboard: dash,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "PILLOW_BRAIN_SHELL_TRACE_SUMMARY.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        SHELL_READY: shellReady,
        consecutive: `${consecutiveResults.filter((r) => r.ok).length}/10`,
        stateful: summary.STATEFUL_SEQUENCE,
        envelope: envMax,
        degraded,
        replaced,
        equivalentRate: summary.BRAIN_TO_USER_EQUIVALENT_RATE,
      },
      null,
      2,
    ),
  );
  if (!shellReady) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
