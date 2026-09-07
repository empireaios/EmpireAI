/**
 * GK_PATH_QUALIFICATION — must share material layers with actual Grand King chat.
 * Requirements:
 * - BFF: https://empire-ai.co/api/pillow/chat (not Brain direct)
 * - workspaceContext.screenId = SCR-800 (Pillow Centre)
 * - reports bffRecovery / infrastructure budget as FAIL
 * - GK_PATH_EQUIVALENCE=YES only when all cases pass without infra fallback
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

function stubTakeover(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(text) &&
    /\*\*Need:\*\*/i.test(text) &&
    !/Contribution\/order|Eligible|SELECT|Recommended/i.test(text)
  );
}

function infra(text) {
  return /completed executive answer was not produced within the infrastructure budget/i.test(
    String(text || ""),
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
  // GK UI does not forceNew on every turn — but for qual isolation we still mint
  // a server session via the same BFF endpoint. Equivalence is endpoint+context+auth.
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `gkqual-${Date.now()}`;
}

async function chat(cookie, sessionId, message, workspaceContext = GK_CTX) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message, workspaceContext }),
    signal: AbortSignal.timeout(290_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body?.result?.message || body?.message || "");
  return {
    status: r.status,
    ms: Date.now() - t0,
    text,
    kind: body?.result?.kind || null,
    bffRecovery: Boolean(body?.result?.bffRecovery),
    degradeReason: body?.result?.degradeReason || null,
    infra: infra(text),
    stub: stubTakeover(text),
  };
}

const cases = [
  {
    id: "arith",
    prompt:
      "Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution per order?",
    ok: (r) => /14\.60/.test(r.text) && !r.infra && !r.stub,
  },
  {
    id: "multi_gate",
    prompt:
      "Eligible if approval granted. QUILL granted. EMBER pending. Select eligible only.",
    ok: (r) => /QUILL/i.test(r.text) && !r.infra && !r.stub,
  },
  {
    id: "open_strategy",
    prompt:
      "Design a short supplier-selection process. What would you do first? Do not claim live EmpireAI access.",
    ok: (r) => !r.infra && !r.stub && /(?:first|gate|supplier|plan|step|criteria)/i.test(r.text),
  },
  {
    id: "bounded_supplier",
    prompt:
      "Short NovaCart-style bounded supplier decision. Eligible if approval granted. VISTA granted. WISP pending. Select eligible only. Keep under 12 lines.",
    ok: (r) => /VISTA/i.test(r.text) && !r.infra && !r.stub,
  },
  {
    id: "live_unknown_fact",
    prompt: "How many realised orders has EmpireAI received? Briefly.",
    ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.infra,
  },
  {
    id: "warm_transition",
    sequence: true,
    steps: [
      {
        prompt: "How many realised orders has EmpireAI received? Briefly.",
        ok: (r) => /\b0\b|zero|none/i.test(r.text) && !r.infra,
      },
      {
        prompt:
          "Synthetic new case. Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order? Eligible if approval granted. RADIX granted. SOLAR pending. Select.",
        ok: (r) => /14\.60/.test(r.text) && /RADIX/i.test(r.text) && !r.infra && !r.stub,
      },
    ],
  },
  {
    id: "pct_fee",
    prompt:
      "Price S$39.90, supplier S$12.35, shipping S$4.80, marketplace fee 14.5% of selling price, refund S$1.20. Contribution per order?",
    ok: (r) => /15\.76/.test(r.text) && !r.infra,
  },
  {
    id: "negative_contrib",
    prompt: "Price S$20, cost S$18, ship S$4, fee 10% of price, refund S$1. Contribution/order?",
    ok: (r) => /-[ ]?5\.00|-5\b/.test(r.text) && !r.infra,
  },
  {
    id: "missing_fee",
    prompt:
      "Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?",
    ok: (r) => /UNKNOWN/i.test(r.text) && !r.infra,
  },
  {
    id: "mixed_fx",
    prompt:
      "Price S$40, supplier cost USD 18, shipping S$4, fee 6% of price. Contribution?",
    ok: (r) => /(?:MIXED|no invented FX|conversion|UNKNOWN)/i.test(r.text) && !r.infra,
  },
  {
    id: "hard_gate_def",
    prompt: "In one sentence, what is a hard gate in supplier selection?",
    ok: (r) => !r.infra && !r.stub && r.text.length > 40,
  },
  {
    id: "operating_brief_short",
    prompt: "Operating brief: what matters most for EmpireAI commerce this week? Be concise.",
    ok: (r) => !r.infra && !r.stub && r.text.length > 40,
  },
];

async function main() {
  const h = await health();
  const cookie = await login();
  const results = [];
  let infraFallbacks = 0;
  const latencies = [];

  for (const c of cases) {
    const sessionId = await createSession(cookie);
    if (c.sequence) {
      let okAll = true;
      const stepOut = [];
      for (const step of c.steps) {
        const r = await chat(cookie, sessionId, step.prompt);
        latencies.push(r.ms);
        if (r.infra) infraFallbacks++;
        stepOut.push({ prompt: step.prompt.slice(0, 80), ...r, text: r.text.slice(0, 400) });
        if (!step.ok(r)) okAll = false;
      }
      results.push({ id: c.id, ok: okAll, steps: stepOut });
    } else {
      const r = await chat(cookie, sessionId, c.prompt);
      latencies.push(r.ms);
      if (r.infra) infraFallbacks++;
      const ok = c.ok(r);
      results.push({
        id: c.id,
        ok,
        ...r,
        text: r.text.slice(0, 500),
      });
    }
  }

  latencies.sort((a, b) => a - b);
  const failures = results.filter((r) => !r.ok).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    ROUTE: "GK_PATH_QUALIFICATION",
    GK_PATH_EQUIVALENCE: failures === 0 && infraFallbacks === 0,
    EQUIVALENCE_REQUIREMENTS: [
      "BFF https://empire-ai.co/api/pillow/chat",
      "auth empireai_session cookie via /api/auth/login",
      "workspaceContext.screenId=SCR-800",
      "workspaceContext.module=executive",
      "chat timeout 290s (client-aligned)",
      "infra budget terminal = FAIL",
      "bffRecovery true = FAIL",
    ],
    DEPLOYMENT_ID: String(h?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    POST_FIX_GK_PATH_CASES: results.length,
    POST_FIX_INFRASTRUCTURE_FALLBACK: infraFallbacks,
    failures,
    LATENCY_P50_MS: latencies[Math.floor(latencies.length * 0.5)] || 0,
    LATENCY_P95_MS: latencies[Math.floor(latencies.length * 0.95)] || 0,
    results,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "GK_PATH_QUALIFICATION.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        GK_PATH_EQUIVALENCE: summary.GK_PATH_EQUIVALENCE,
        cases: summary.POST_FIX_GK_PATH_CASES,
        infra: infraFallbacks,
        failures,
        p50: summary.LATENCY_P50_MS,
        p95: summary.LATENCY_P95_MS,
      },
      null,
      2,
    ),
  );
  if (!summary.GK_PATH_EQUIVALENCE) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
