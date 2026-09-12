/**
 * Production first-visible: W1-T1 decision-state propagation (NEW scenarios only).
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
      console.error(`${label} attempt ${i}:`, e?.cause?.code || e?.message || e);
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
    return body.session?.sessionId || body.sessionId || `w1t1-${Date.now()}`;
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

function stub(t) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(t) &&
    /\*\*Need:\*\*/i.test(t)
  );
}

function unitEconHijack(t) {
  return /Mixed currencies|deterministic calculator/i.test(t) && /Contribution\/order:\s*UNKNOWN/i.test(t);
}

const cases = [
  {
    id: "corrected_pass_to_fail",
    prompt: `Bounded decision. Piston: contribution 12.5, stock 1200, delivery 5 days, approval granted. Rivet: contribution 16.0, stock 1500, delivery 4 days, approval pending. Anvil: contribution 14.0, stock 1100, approval granted, earlier delivery 5 days, later verified corrected delivery 8 days. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Select highest contribution among currently eligible. Answer eligible set, selection, and if Rivet approval granted whether selection changes.`,
    ok: (t) =>
      !stub(t) &&
      !unitEconHijack(t) &&
      /Piston/i.test(t) &&
      /eligib/i.test(t) &&
      !/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t) &&
      !(/\bAnvil\b/i.test(t) && /\bAnvil\b[^.\n]{0,40}\beligible\b/i.test(t) && !/\bAnvil\b[^.\n]{0,60}\bineligible\b/i.test(t)),
  },
  {
    id: "corrected_fail_to_pass",
    prompt: `Bounded decision. Harbor: contribution 11.0, stock 1200, delivery 5 days, approval granted. Quay: contribution 10.5, stock 1100, approval granted, earlier delivery 9 days, later verified corrected delivery 4 days. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Select highest eligible contribution.`,
    ok: (t) => !stub(t) && /Quay|Harbor/i.test(t) && !/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t),
  },
  {
    id: "sole_eligible",
    prompt: `Bounded. Falcon: contribution 12.0, stock 1200, delivery 5 days, approval granted. Osprey: contribution 15.0, stock 1500, delivery 4 days, approval pending. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Who is currently eligible and selected?`,
    ok: (t) => !stub(t) && /Falcon/i.test(t) && !/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t),
  },
  {
    id: "multiple_eligible",
    prompt: `Bounded. Delta: contribution 12.0, stock 1200, delivery 5 days, approval granted. Echo: contribution 13.5, stock 1300, delivery 4 days, approval granted. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Select highest contribution eligible.`,
    ok: (t) => !stub(t) && /Echo/i.test(t),
  },
  {
    id: "zero_eligible",
    prompt: `Bounded. Jetty: contribution 12.0, stock 1200, delivery 9 days, approval granted. Quay: contribution 15.0, stock 1500, delivery 8 days, approval pending. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Current selection?`,
    ok: (t) =>
      !stub(t) &&
      (/\bDO\s+NOT\s+SELECT\b/i.test(t) || /none\s+eligible|no\s+candidate/i.test(t)),
  },
  {
    id: "pending_future_reversal",
    prompt: `Bounded. Nova: contribution 12.8, stock 1200, delivery 5 days, approval granted. Orion: contribution 16.4, stock 1600, delivery 4 days, approval pending. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Current selection and if Orion approval becomes granted whether selection changes.`,
    ok: (t) => !stub(t) && /Nova/i.test(t) && /Orion/i.test(t) && !/\bOrion\b[^.\n]{0,40}\bcurrently eligible\b/i.test(t),
  },
  {
    id: "multiple_blockers",
    prompt: `Bounded. Kestrel: contribution 12.0, stock 800, delivery 5 days, approval pending. Falcon: contribution 11.0, stock 1200, delivery 5 days, approval granted. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. If Kestrel stock restored to 1200 but approval still pending, does Kestrel become eligible?`,
    ok: (t) => !stub(t) && /Falcon|Kestrel/i.test(t),
  },
  {
    id: "given_metric_no_arith",
    prompt: `Bounded. Cedar: contribution US$12/unit, stock 1000, delivery 5 days, approval granted. Elm: contribution US$11/unit, stock 1000, delivery 5 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose highest contribution eligible. Do not recompute unit economics.`,
    ok: (t) => !stub(t) && !unitEconHijack(t) && /Cedar/i.test(t),
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
    const r = await chat(cookie, sessionId, c.prompt);
    const ok = r.status < 500 && !r.infra && c.ok(r.text);
    results.push({
      id: c.id,
      ok,
      ms: r.ms,
      status: r.status,
      requestId: r.requestId,
      preview: r.text.slice(0, 240),
    });
    if (!ok) fail++;
    console.log(ok ? "PASS" : "FAIL", c.id, r.ms + "ms");
  }
  const summary = {
    mission: "W1_T1_CROSS_SECTION_DECISION_CONSISTENCY",
    DEPLOYMENT_ID: deploymentId,
    RUNNING_BRAIN_SHA: sha || null,
    pass: results.filter((r) => r.ok).length,
    fail,
    results,
    timestamp: new Date().toISOString(),
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "W1_T1_DECISION_STATE_PROPAGATION_PRODUCTION.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify({ pass: summary.pass, fail, deploymentId, sha }, null, 2));
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
