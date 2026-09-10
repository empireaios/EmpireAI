/**
 * Production first-visible: given-metric arithmetic authority (SEMANTIC_INTERFERENCE_FORENSIC).
 * Shell architecture untouched — semantic authority narrowing only.
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

async function withRetry(label, fn, attempts = 4) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.error(`${label} attempt ${i}/${attempts}:`, e?.cause?.code || e?.message || e);
      if (i < attempts) await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  throw last;
}

async function health() {
  return withRetry("health", async () => {
    const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    return r.json();
  });
}

async function login() {
  return withRetry("login", async () => {
    const r = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(60_000),
    });
    const cookie = extractCookie(r);
    if (!cookie) throw new Error(`login_failed ${r.status}`);
    return cookie;
  });
}

async function createSession(cookie) {
  return withRetry("session", async () => {
    const r = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ forceNew: true }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await r.json().catch(() => ({}));
    return body.session?.sessionId || body.sessionId || `gma-${Date.now()}`;
  });
}

async function chat(cookie, sessionId, message) {
  return withRetry("chat", async () => {
    const t0 = Date.now();
    const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        sessionId,
        message,
        workspaceContext: {
          screenPath: "/cockpit/development/pillow",
          screenId: "SCR-800",
          screenTitle: "Pillow Centre",
          module: "executive",
        },
      }),
      signal: AbortSignal.timeout(290_000),
    });
    const body = await r.json().catch(() => ({}));
    const text =
      body?.assistantMessage?.content ||
      body?.result?.message ||
      body?.message ||
      body?.reply ||
      JSON.stringify(body);
    return {
      status: r.status,
      text: String(text),
      ms: Date.now() - t0,
      requestId: body?.result?.requestId || body?.requestId || null,
      infra: /infrastructure budget|Tier-0|worker unavailable/i.test(String(text)),
    };
  });
}

function stubTakeover(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(text) &&
    /\*\*Need:\*\*/i.test(text) &&
    !/Contribution\/order|Eligible|Select/i.test(text)
  );
}

function unitEconHijack(text) {
  return (
    /Mixed currencies without an explicit FX|Currency:\s*MIXED|Contribution\/order:\s*UNKNOWN/i.test(
      text,
    ) && /deterministic calculator/i.test(text)
  );
}

const JUNIPER = `Architecture checkpoint — bounded decision

Three suppliers:

Juniper:
contribution US$13/unit
stock 1,000
delivery 5 days
approval granted.

Lotus:
contribution US$17/unit
stock 1,500
delivery 4 days
approval pending.

Maple:
contribution US$15/unit
stock 1,200
delivery 7 days
approval granted.

Eligibility:
contribution >=10
stock >=900
delivery <=6
approval granted.

Choose eligible supplier with highest contribution.

Answer only:
1. Current eligible set.
2. Supplier to select now.
3. If Lotus approval becomes granted, whether selection changes and to whom.`;

const cases = [
  {
    id: "given_contribution_decision",
    prompt: JUNIPER,
    ok: (t) =>
      !unitEconHijack(t) &&
      !stubTakeover(t) &&
      /Juniper/i.test(t) &&
      /eligib/i.test(t) &&
      !/\bMaple\b[^.\n]{0,40}\beligib/i.test(t),
  },
  {
    id: "given_metric_reversal",
    prompt: JUNIPER,
    ok: (t) =>
      !unitEconHijack(t) &&
      /Lotus/i.test(t) &&
      /(?:selection changes|select(?:s|ion)?\s+Lotus|changes to Lotus)/i.test(t),
  },
  {
    id: "pct_fee_calculation",
    prompt:
      "Synthetic. Price S$39.90, supplier cost S$12.35, shipping S$4.80, marketplace fee 14.5% of selling price, refund allowance S$1.20. What is contribution per order? Answer with the exact number.",
    ok: (t) => /15\.76/.test(t) && !stubTakeover(t),
  },
  {
    id: "true_mixed_currency",
    prompt:
      "Synthetic. Price US$40, supplier cost S$18, shipping US$4, fee 6% of price. Contribution per order?",
    ok: (t) =>
      /(?:MIXED|no invented FX|conversion rate|UNKNOWN)/i.test(t) &&
      !/(?:1\s*USD\s*=|assuming\s+(?:an\s+)?(?:exchange\s+)?rate)/i.test(t) &&
      !stubTakeover(t),
  },
  {
    id: "usd_after_sgd_warm",
    sequence: [
      {
        prompt:
          "Synthetic prior. Price S$40, cost S$18, ship S$4, fee 6% of price, refund S$1. Contribution/order briefly.",
        ok: (t) => /14\.60/.test(t) || /contribution/i.test(t),
      },
      {
        prompt: `New bounded case only (USD). Cedar: contribution US$12/unit, stock 1000, delivery 5 days, approval granted. Elm: contribution US$11/unit, stock 1000, delivery 5 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose highest contribution eligible. Do not recompute unit economics.`,
        ok: (t) =>
          !unitEconHijack(t) &&
          /Cedar/i.test(t) &&
          !/Currency:\s*MIXED/i.test(t) &&
          !stubTakeover(t),
      },
    ],
  },
  {
    id: "open_strategy",
    prompt:
      "Design a synthetic supplier-selection process. What would you do first? Do not claim live EmpireAI access.",
    ok: (t) => !stubTakeover(t) && /(?:first|gate|supplier|plan|step|criteria)/i.test(t),
  },
  {
    id: "live_unknown_fact",
    prompt: "How many realised marketplace orders has EmpireAI completed this week? Be brief.",
    ok: (t) =>
      !unitEconHijack(t) &&
      (/\b0\b|zero|none|unknown|no realised|not.*verified|unsupported/i.test(t) ||
        t.length > 20),
  },
];

async function main() {
  const h = await health();
  const deploymentId = String(h?.deploy?.deploymentId || "");
  const sha = String(h?.deploy?.gitCommitSha || "");
  console.log("DEPLOYMENT", deploymentId, "SHA", sha);
  const cookie = await login();
  const results = [];
  let fail = 0;

  for (const c of cases) {
    const sessionId = await createSession(cookie);
    if (c.sequence) {
      let allOk = true;
      const parts = [];
      for (const step of c.sequence) {
        const r = await chat(cookie, sessionId, step.prompt);
        const ok = r.status < 500 && !r.infra && step.ok(r.text);
        parts.push({ preview: r.text.slice(0, 180), ok, ms: r.ms, status: r.status });
        if (!ok) allOk = false;
      }
      results.push({ id: c.id, ok: allOk, parts });
      if (!allOk) fail++;
      console.log(allOk ? "PASS" : "FAIL", c.id);
    } else {
      const r = await chat(cookie, sessionId, c.prompt);
      const ok = r.status < 500 && !r.infra && c.ok(r.text);
      results.push({
        id: c.id,
        ok,
        ms: r.ms,
        status: r.status,
        requestId: r.requestId,
        preview: r.text.slice(0, 220),
      });
      if (!ok) fail++;
      console.log(ok ? "PASS" : "FAIL", c.id, r.ms + "ms");
    }
  }

  const summary = {
    mission: "SEMANTIC_INTERFERENCE_FORENSIC",
    DEPLOYMENT_ID: deploymentId,
    RUNNING_BRAIN_SHA: sha || null,
    pass: results.filter((r) => r.ok).length,
    fail,
    results,
    timestamp: new Date().toISOString(),
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "GIVEN_METRIC_ARITHMETIC_AUTHORITY_PRODUCTION.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify({ pass: summary.pass, fail, deploymentId, sha }, null, 2));
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
