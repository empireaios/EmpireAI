/**
 * Foundation Reset Level C — production Cockpit canary (synthetic only).
 * Does NOT run sealed Wave exams. Does NOT authorize Birth.
 *
 * Usage: node backend/scripts/pillow-foundation-reset-levelc.mjs
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
const EVIDENCE = path.join(OUT, "FOUNDATION_PRODUCTION_CERTIFICATION.json");

const DELEGATION_HIJACK = /###\s*Delegation reading/i;
const CLAIM_HIJACK = /### Claim audit|Treat unsupported sales, demand-strength/i;
const COMMERCE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const ASK_AGAIN = /\b(?:tell me which theme|please ask again|do not need to resubmit)\b/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function chat(cookie, sessionId, message) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body.result?.message ?? body.message ?? "").trim();
  return {
    status: r.status,
    text,
    sessionId: body.reboundSessionId || sessionId,
    ms: Date.now() - t0,
    requestId: body.result?.requestId ?? null,
  };
}

const PROBES = [
  {
    id: "evidence_no_authority_hijack",
    message: [
      "SyntheticCanaryFoundation-E1 — analysis only. Do not mention EmpireAI products, Birth, sales, or revenue.",
      "Historical note: Unit Cobalt was forecast to reach revenue up to $2400.",
      "Supplier claim: Unit Cobalt maps to another catalog SKU because both appear in the same planning file.",
      "Later ledger: a realised transaction of $180 was recorded for a different line.",
      "1) Classify the forecast figure",
      "2) Classify the co-occurrence identity claim",
      "3) What does the later transaction supersede?",
      "4) What remains unproven?",
    ].join("\n"),
    forbid: [DELEGATION_HIJACK, COMMERCE, ASK_AGAIN],
    require: [/forecast|estimate|unproven|identity|supersed/i],
  },
  {
    id: "authority_no_claim_audit",
    message: [
      "SyntheticCanaryFoundation-A1 — do not mention products or realised sales.",
      "I authorize Pillow standing discretion for reversible tests below $780.",
      "1) Is owner authorization present?",
      "2) Is system spend capability present from this chat?",
      "3) Did execution occur?",
    ].join("\n"),
    forbid: [CLAIM_HIJACK, COMMERCE, ASK_AGAIN],
    require: [/authori|capability|execution|cannot|not (?:yet )?connected/i],
  },
  {
    id: "mixed_composition",
    message: [
      "SyntheticCanaryFoundation-M1 — answer each numbered ask separately.",
      "Evidence: Module KEEL forecast up to $1250; co-occurrence identity claim in one note.",
      "Authority: Grand King authorizes one-time reversible test below $200.",
      "1) Classify the forecast.",
      "2) Is owner authorization present?",
      "3) Is spend capability present from this chat?",
      "Do not mention live EmpireAI products, Birth, or realised revenue.",
    ].join("\n"),
    forbid: [COMMERCE, ASK_AGAIN],
    require: [/forecast|estimate|authori|capability/i],
  },
  {
    id: "synthetic_isolation",
    message:
      'SyntheticCanaryFoundation-S1: Scenario-only. Audit whether "Service Riven will succeed commercially" is established. Do not mention EmpireAI live products, Birth, or realised revenue.',
    forbid: [COMMERCE, /Birth remains/i, ASK_AGAIN],
    require: [/unproven|unsupported|scenario|not established/i],
  },
  {
    id: "simple_followup_reliability",
    message:
      "SyntheticCanaryFoundation-R1: In one short paragraph, can Pillow chat execute paid ads from this chat today?",
    forbid: [ASK_AGAIN, COMMERCE],
    require: [/cannot|capability|not (?:yet )?connected|execute|authori/i],
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "PILLOW_FOUNDATION_RESET",
    startedAt: new Date().toISOString(),
    deploySha: null,
    results: [],
    fail: 0,
    WAVE_1_CURRENT_CERTIFICATION: "RESET / NOT CURRENTLY CERTIFIED",
    WAVE_2_CURRENT_CERTIFICATION: "NOT CERTIFIED",
    WAVE_3: "LOCKED",
    BIRTH_AUTHORISED: false,
    BIRTH_TIMESTAMP: null,
  };

  try {
    const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? null;
  } catch {
    /* non-blocking */
  }

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(55_000),
  });
  const cookie = extractCookie(login);
  report.results.push({ step: "login", ok: login.ok && Boolean(cookie), status: login.status });
  if (!login.ok || !cookie) {
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
    process.exit(2);
  }

  // Seed + foundation inspect via Brain (same session cookie if shared; else best-effort).
  try {
    const seed = await fetch(`${BRAIN}/api/pillow/institutional-memory/seed`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(60_000),
    });
    const sj = await seed.json().catch(() => ({}));
    report.results.push({
      step: "seed_institutional_memory",
      ok: seed.ok,
      status: seed.status,
      seeded: sj.seeded ?? sj.keys?.length,
    });
  } catch (e) {
    report.results.push({
      step: "seed_institutional_memory",
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const fs = await fetch(`${BRAIN}/api/pillow/executive-learning/foundation-state`, {
      headers: { cookie },
      signal: AbortSignal.timeout(60_000),
    });
    const fj = await fs.json().catch(() => ({}));
    report.results.push({
      step: "foundation_state",
      ok: fs.ok,
      status: fs.status,
      totals: fj.totals,
      waves: fj.waves,
      birthAuthorised: fj.birthAuthorised,
    });
    report.foundationState = {
      totals: fj.totals,
      schemaVersion: fj.schemaVersion,
      waves: fj.waves,
    };
  } catch (e) {
    report.results.push({
      step: "foundation_state",
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // Fresh session per probe for permanence / no prior chat dependency.
  for (const probe of PROBES) {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    let sessionId =
      sj.sessionId ||
      sj.id ||
      sj.result?.sessionId ||
      sj.session?.sessionId ||
      sj.data?.sessionId;
    if (!sessionId) {
      report.fail += 1;
      report.results.push({
        step: `probe_${probe.id}`,
        ok: false,
        reason: "session",
        keys: Object.keys(sj || {}),
      });
      continue;
    }

    const r = await chat(cookie, sessionId, probe.message);
    const forbidHits = probe.forbid.filter((re) => re.test(r.text)).map(String);
    const requireOk = probe.require.some((re) => re.test(r.text));
    const ok =
      r.status === 200 &&
      forbidHits.length === 0 &&
      requireOk &&
      r.text.length >= 40 &&
      !ASK_AGAIN.test(r.text);
    if (!ok) report.fail += 1;
    report.results.push({
      step: `probe_${probe.id}`,
      ok,
      status: r.status,
      ms: r.ms,
      requestId: r.requestId,
      forbidHits,
      requireOk,
      len: r.text.length,
      answerPreview: r.text.slice(0, 500),
    });
    console.log(`[${probe.id}] ok=${ok} ms=${r.ms} len=${r.text.length}`);
  }

  report.completedAt = new Date().toISOString();
  report.pass = report.results.filter((r) => r.ok).length;
  report.result = report.fail === 0 ? "PASS" : "FAIL";
  writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        fail: report.fail,
        pass: report.pass,
        deploySha: report.deploySha,
        evidence: EVIDENCE,
      },
      null,
      2,
    ),
  );
  process.exit(report.fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
