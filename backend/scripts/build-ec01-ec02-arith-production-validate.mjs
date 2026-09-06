/**
 * Production first-visible validation for EC01/EC02 commercial arithmetic BUILD.
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
  console.error("Missing login credentials");
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
    body: JSON.stringify({ forceNew: true }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `arith-${Date.now()}`;
}

async function chat(cookie, sessionId, message) {
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
      },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await r.json().catch(() => ({}));
  const text =
    body?.assistantMessage?.content ||
    body?.result?.message ||
    body?.message ||
    body?.reply ||
    JSON.stringify(body);
  return { status: r.status, text: String(text), ms: Date.now() - t0 };
}

function stubTakeover(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(text) &&
    /\*\*Need:\*\*/i.test(text) &&
    !/Contribution\/order|Recommended first moves|Eligible/i.test(text)
  );
}

const cases = [
  {
    id: "pct_fee_product",
    prompt:
      "Synthetic. Price S$39.90, supplier cost S$12.35, shipping S$4.80, marketplace fee 14.5% of selling price, refund allowance S$1.20. What is contribution per order? Answer with the exact number.",
    ok: (t) => /15\.76/.test(t) && !stubTakeover(t),
  },
  {
    id: "fixed_fee_product",
    prompt:
      "Synthetic. Price S$50, cost S$20, ship S$5, marketplace fixed fee S$3.50, refund S$0. Contribution/order?",
    ok: (t) => /21\.50/.test(t) && !stubTakeover(t),
  },
  {
    id: "negative_contribution",
    prompt:
      "Synthetic. Price S$20, cost S$18, ship S$4, fee 10% of price, refund S$1. Contribution/order?",
    ok: (t) => /-[ ]?5\.00|-5\b/.test(t) && !stubTakeover(t),
  },
  {
    id: "forecast_vs_realised",
    prompt:
      "Synthetic. Forecast contribution/order S$12 on 100 orders. Realised: revenue S$900, COGS S$500, fees S$80, shipping S$60, refunds S$40, orders 80. Keep forecast and realised separate. State realised contribution/order.",
    ok: (t) =>
      !stubTakeover(t) &&
      /\brealis/i.test(t) &&
      /2\.75/.test(t) &&
      !/(?:exchange\s+rate|1\s*USD\s*=)/i.test(t) &&
      !/(?:blended|combined)\s+contribution/i.test(t),
  },
  {
    id: "supplier_decision_with_arith",
    prompt:
      "Synthetic. Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order? Eligible if approval granted. QUILL granted. EMBER pending. Select eligible.",
    ok: (t) => /14\.60/.test(t) && /QUILL/i.test(t) && !stubTakeover(t),
  },
  {
    id: "missing_fee",
    prompt:
      "Synthetic. Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?",
    ok: (t) =>
      /Contribution\/order:\*\*\s*UNKNOWN|Contribution\/order:\s*UNKNOWN|CONTRIBUTION\s*=\s*UNKNOWN/i.test(
        t,
      ) &&
      !/assume(?:s|d|ing)?\s+(?:the\s+)?(?:marketplace\s+)?fee\s+is\s+zero/i.test(t) &&
      !stubTakeover(t),
  },
  {
    id: "mixed_currency",
    prompt:
      "Synthetic. Price S$40, supplier cost USD 18, shipping S$4, fee 6% of price. Contribution?",
    ok: (t) =>
      /(?:MIXED|no invented FX|conversion rate|UNKNOWN)/i.test(t) &&
      !/(?:1\s*USD\s*=|assuming\s+(?:an\s+)?(?:exchange\s+)?rate)/i.test(t) &&
      !stubTakeover(t),
  },
  {
    id: "warm_bounded",
    sequence: [
      {
        prompt: "How many realised orders has EmpireAI received? Briefly.",
        ok: (t) => /\b0\b|zero|none/i.test(t),
      },
      {
        prompt:
          "Synthetic new case. Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order? Eligible if approval granted. RADIX granted. SOLAR pending. Select.",
        ok: (t) => /14\.60/.test(t) && /RADIX/i.test(t) && !stubTakeover(t),
      },
    ],
  },
  {
    id: "open_g1_preserve",
    prompt:
      "Design a synthetic supplier-selection process. What would you do first? Do not claim live EmpireAI access.",
    ok: (t) => !stubTakeover(t) && /(?:first|gate|supplier|plan|step|criteria)/i.test(t),
  },
  {
    id: "classic_ec01",
    prompt:
      "Synthetic probe only. Price S$40, supplier cost S$18, shipping S$4, marketplace fee 6% of price, refund allowance S$1. What is contribution per order? One short answer with the number.",
    ok: (t) => /14\.60/.test(t) && !/\bS?\$?15\b/.test(t.replace(/14\.60/g, "")),
  },
];

async function main() {
  const h = await health();
  const deploymentId = String(h?.deploy?.deploymentId || "");
  console.log("DEPLOYMENT", deploymentId, "SHA", h?.deploy?.gitCommitSha);
  const cookie = await login();
  const results = [];
  let failures = 0;
  const latencies = [];

  for (const c of cases) {
    const sessionId = await createSession(cookie);
    if (c.sequence) {
      let okAll = true;
      const texts = [];
      for (const step of c.sequence) {
        const r = await chat(cookie, sessionId, step.prompt);
        latencies.push(r.ms);
        texts.push(r.text);
        if (!step.ok(r.text)) okAll = false;
      }
      results.push({ id: c.id, ok: okAll, texts: texts.map((t) => t.slice(0, 500)), stub: texts.some(stubTakeover) });
      if (!okAll) failures++;
    } else {
      const r = await chat(cookie, sessionId, c.prompt);
      latencies.push(r.ms);
      const ok = c.ok(r.text);
      results.push({ id: c.id, ok, text: r.text.slice(0, 700), stub: stubTakeover(r.text), ms: r.ms });
      if (!ok) failures++;
    }
  }

  latencies.sort((a, b) => a - b);
  const summary = {
    generatedAt: new Date().toISOString(),
    DEPLOYMENT_ID: deploymentId,
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    PRODUCTION_FIRST_VISIBLE_PASS: failures === 0,
    failures,
    results,
    REPRESENTATIVE_REVIEW_COUNT: results.length,
    MATERIAL_ANOMALIES: failures,
    LATENCY_P50_MS: latencies[Math.floor(latencies.length * 0.5)] || 0,
    LATENCY_P95_MS: latencies[Math.floor(latencies.length * 0.95)] || 0,
    EXTRA_LLM_CALLS: 0,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "BUILD_EC01_EC02_ARITH_PRODUCTION_VALIDATE.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ pass: failures === 0, failures, p50: summary.LATENCY_P50_MS, p95: summary.LATENCY_P95_MS }, null, 2));
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
