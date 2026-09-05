/**
 * Production first-visible validation after epistemic UNBLOCK deploy.
 * New scenarios only — no sealed Wave exams. Grand King is not the courier.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const EXPECT_SHA = process.env.EXPECT_SEMANTIC_SHA || "";

if (!EMAIL || !PASSWORD) {
  console.error("Missing login credentials in environment");
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
  if (!cookie) throw new Error(`login_failed status=${r.status}`);
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
  return body.session?.sessionId || body.sessionId || `unb-${Date.now()}`;
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
    body?.message ||
    body?.reply ||
    body?.text ||
    JSON.stringify(body).slice(0, 2000);
  return { status: r.status, text: String(text), ms: Date.now() - t0 };
}

function stubTakeover(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:Unsupported as established fact|Unverified assertion)/i.test(text) &&
    /\*\*Need:\*\*/i.test(text) &&
    !/Recommended first moves|ASSUMPTIONS|Current action:\s*SELECT|Eligible/i.test(text)
  );
}

function inventsLive(text) {
  return /\b(?:realised orders?\s+(?:are|is|=)\s*[1-9]|stock\s+(?:is|=)\s*[1-9][0-9]{2,}|revenue\s+(?:is|=)\s*[1-9])/i.test(
    text,
  );
}

const cases = [
  {
    id: "open_strategy",
    fresh: true,
    prompt:
      "Design a synthetic supplier-selection process for a marketplace business. What would you do first? Do not claim live EmpireAI access.",
    ok: (t) =>
      !stubTakeover(t) &&
      /(?:first|gate|eligib|assum|evidence|plan|step|supplier)/i.test(t) &&
      !inventsLive(t),
  },
  {
    id: "bounded_supplier",
    fresh: true,
    prompt:
      "Synthetic procurement. Eligible if approval granted. QUILL granted. EMBER pending. Select the currently eligible supplier in one short paragraph.",
    ok: (t) => !stubTakeover(t) && /QUILL/i.test(t) && !/\bselect\b[^\n.]{0,40}\bEMBER\b/i.test(t),
  },
  {
    id: "bounded_product",
    fresh: true,
    prompt:
      "Synthetic product pick. Hard gate returns <= 8%. ProductA returns 11%. ProductB returns 6%. Which product is currently eligible?",
    ok: (t) => !stubTakeover(t) && /ProductB/i.test(t),
  },
  {
    id: "bounded_corridor",
    fresh: true,
    prompt:
      "Synthetic corridor. Eligible if policy clear AND stock available. PATH_A: policy clear; stock available. PATH_B: policy blocked; stock available. Select.",
    ok: (t) => !stubTakeover(t) && /PATH_A/i.test(t),
  },
  {
    id: "live_unknown",
    fresh: true,
    prompt: "What is EmpireAI's current realised order count? Do not invent figures.",
    ok: (t) => !inventsLive(t) || /\b0\b|zero|none|not (?:yet )?author|no realised/i.test(t),
  },
  {
    id: "live_then_bounded",
    fresh: true,
    sequence: [
      {
        prompt: "How many realised orders has EmpireAI received? Answer briefly.",
        ok: (t) => /\b0\b|zero|none|not yet|no realised/i.test(t) || !inventsLive(t),
      },
      {
        prompt:
          "Synthetic new case after that live question. Eligible if approval granted. RADIX granted. SOLAR pending. Select the currently eligible supplier.",
        ok: (t) => !stubTakeover(t) && /RADIX/i.test(t) && !/Unsupported as established fact/i.test(t),
      },
    ],
  },
  {
    id: "bounded_then_live",
    fresh: true,
    sequence: [
      {
        prompt:
          "Synthetic. Eligible if approval granted. TIDE granted. ULTRA pending. Who is eligible?",
        ok: (t) => !stubTakeover(t) && /TIDE/i.test(t),
      },
      {
        prompt: "Now switch: what is EmpireAI current realised revenue? Do not invent.",
        ok: (t) => !inventsLive(t) || /\b0\b|zero/i.test(t),
      },
    ],
  },
  {
    id: "principle_transfer",
    fresh: true,
    prompt:
      "Synthetic principle. Rule: pending approval is not currently eligible. VISTA: approval granted. WISP: approval PENDING. Apply the principle and select.",
    ok: (t) => !stubTakeover(t) && /VISTA/i.test(t) && !/\bselect\b[^\n.]{0,40}\bWISP\b/i.test(t),
  },
  {
    id: "self_correction",
    fresh: true,
    prompt:
      "Synthetic arithmetic check. Contribution is S$20 exactly. Confirm whether S$20 is correct in one sentence.",
    ok: (t) => !stubTakeover(t) && /20|correct|yes/i.test(t),
  },
];

async function main() {
  // Load dotenv if present
  try {
    const envPath = path.join(ROOT, "backend/.env");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }

  const h = await health();
  const sha = String(h?.deploy?.gitCommitSha || "");
  const deploymentId = String(h?.deploy?.deploymentId || "");
  console.log("RUNNING_SHA", sha, "DEPLOYMENT", deploymentId);
  if (EXPECT_SHA && !sha.startsWith(EXPECT_SHA.slice(0, 8))) {
    console.error(`SHA mismatch expect~${EXPECT_SHA} got ${sha}`);
    process.exit(3);
  }

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
      results.push({
        id: c.id,
        ok: okAll,
        texts: texts.map((t) => t.slice(0, 600)),
        stub: texts.some(stubTakeover),
      });
      if (!okAll) failures++;
    } else {
      const r = await chat(cookie, sessionId, c.prompt);
      latencies.push(r.ms);
      const ok = c.ok(r.text);
      results.push({
        id: c.id,
        ok,
        text: r.text.slice(0, 800),
        stub: stubTakeover(r.text),
        ms: r.ms,
      });
      if (!ok) failures++;
    }
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  const review = results.slice(0, 10).map((r) => ({
    id: r.id,
    DID_PILLOW_ACTUALLY_REASON: r.ok && !r.stub,
    DID_GENERIC_STUB_REPLACE_REASONING: Boolean(r.stub),
    WAS_ANSWER_EXECUTIVE_USEFUL: r.ok,
    excerpt: (r.text || (r.texts && r.texts.join(" | ")) || "").slice(0, 400),
  }));

  const summary = {
    generatedAt: new Date().toISOString(),
    RUNNING_BRAIN_SHA: sha,
    DEPLOYMENT_ID: deploymentId,
    PRODUCTION_FIRST_VISIBLE_PASS: failures === 0,
    failures,
    results,
    REPRESENTATIVE_REVIEW_COUNT: review.length,
    MATERIAL_ANOMALIES: failures,
    LATENCY_P50_MS: p50,
    LATENCY_P95_MS: p95,
    review,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "UNBLOCK_EPISTEMIC_PRODUCTION_VALIDATE.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify({ pass: failures === 0, failures, p50, p95, sha }, null, 2));
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
