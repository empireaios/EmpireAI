/**
 * Small post-deploy capability delta slice: EC01, EC02, EC03, EC10, EC18, warm EC25.
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
  return body.session?.sessionId || body.sessionId || `delta-${Date.now()}`;
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
    !/Contribution\/order|Recommended first moves|Eligible|SELECT/i.test(text)
  );
}

const probes = [
  {
    id: "EC01",
    before: "PARTIAL (S$15 vs ~14.60)",
    prompt:
      "Synthetic probe only. Price S$40, supplier cost S$18, shipping S$4, marketplace fee 6% of price, refund allowance S$1. What is contribution per order? One short answer with the number.",
    ok: (t) => /14\.60/.test(t) && !stubTakeover(t),
    classify: (ok) => (ok ? "IMPROVED" : "REGRESSED"),
  },
  {
    id: "EC02",
    before: "NOT_DEMONSTRATED / S$13 vs ~12.60",
    prompt:
      "Synthetic. Price S$40, supplier cost S$20, shipping S$4, marketplace fee 6% of price, refund allowance S$1. Contribution per order after cost rise?",
    ok: (t) => /12\.60/.test(t) && !stubTakeover(t),
    classify: (ok) => (ok ? "IMPROVED" : "REGRESSED"),
  },
  {
    id: "EC03",
    before: "DEMONSTRATED",
    prompt:
      "Synthetic. Forecast contribution/order S$12 on 100 orders. Realised: revenue S$900, COGS S$500, fees S$80, shipping S$60, refunds S$40, orders 80. Keep forecast and realised separate. State realised contribution/order.",
    ok: (t) => /\brealis/i.test(t) && /2\.75/.test(t) && !stubTakeover(t),
    classify: (ok) => (ok ? "UNCHANGED" : "REGRESSED"),
  },
  {
    id: "EC10",
    before: "DEMONSTRATED",
    prompt:
      "Synthetic. Eligible if approval granted. QUILL granted. EMBER pending. Select eligible only.",
    ok: (t) => /QUILL/i.test(t) && !/EMBER/i.test(t.replace(/pending|not|ineligible|exclude/gi, "")) && !stubTakeover(t),
    classify: (ok) => (ok ? "UNCHANGED" : "REGRESSED"),
  },
  {
    id: "EC18",
    before: "IMPROVED after UNBLOCK",
    prompt:
      "Design a synthetic supplier-selection process. What would you do first? Do not claim live EmpireAI access.",
    ok: (t) => !stubTakeover(t) && /(?:first|gate|supplier|plan|step|criteria)/i.test(t),
    classify: (ok) => (ok ? "UNCHANGED" : "REGRESSED"),
  },
  {
    id: "EC25_WARM",
    before: "IMPROVED after UNBLOCK",
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
    classify: (ok) => (ok ? "UNCHANGED" : "REGRESSED"),
  },
];

async function main() {
  const h = await health();
  const cookie = await login();
  const results = [];

  for (const p of probes) {
    const sessionId = await createSession(cookie);
    if (p.sequence) {
      let okAll = true;
      const texts = [];
      for (const step of p.sequence) {
        const r = await chat(cookie, sessionId, step.prompt);
        texts.push(r.text);
        if (!step.ok(r.text)) okAll = false;
      }
      results.push({
        id: p.id,
        before: p.before,
        ok: okAll,
        delta: p.classify(okAll),
        texts: texts.map((t) => t.slice(0, 400)),
        stub: texts.some(stubTakeover),
      });
    } else {
      const r = await chat(cookie, sessionId, p.prompt);
      const ok = p.ok(r.text);
      results.push({
        id: p.id,
        before: p.before,
        ok,
        delta: p.classify(ok),
        text: r.text.slice(0, 500),
        stub: stubTakeover(r.text),
        ms: r.ms,
      });
    }
  }

  const byId = Object.fromEntries(results.map((r) => [r.id, r]));
  const summary = {
    generatedAt: new Date().toISOString(),
    DEPLOYMENT_ID: String(h?.deploy?.deploymentId || ""),
    RUNNING_BRAIN_SHA: String(h?.deploy?.gitCommitSha || ""),
    EC01_BEFORE: "PARTIAL",
    EC01_AFTER: byId.EC01?.ok ? "DEMONSTRATED" : "FAIL",
    EC01_DELTA: byId.EC01?.delta,
    EC02_BEFORE: "NOT_DEMONSTRATED",
    EC02_AFTER: byId.EC02?.ok ? "DEMONSTRATED" : "FAIL",
    EC02_DELTA: byId.EC02?.delta,
    EC03_DELTA: byId.EC03?.delta,
    EC10_DELTA: byId.EC10?.delta,
    EC18_DELTA: byId.EC18?.delta,
    EC25_WARM_DELTA: byId.EC25_WARM?.delta,
    results,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "BUILD_EC01_EC02_ARITH_CAPABILITY_DELTA.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        EC01: summary.EC01_DELTA,
        EC02: summary.EC02_DELTA,
        EC03: summary.EC03_DELTA,
        EC10: summary.EC10_DELTA,
        EC18: summary.EC18_DELTA,
        EC25: summary.EC25_WARM_DELTA,
      },
      null,
      2,
    ),
  );
  if (results.some((r) => !r.ok)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
