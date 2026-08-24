/**
 * Memory relevance / doctrine surface — production first-visible ladder.
 * New scenarios only. No sealed exams (Apex/Orchid/etc). No Wave certification.
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
const EVIDENCE = path.join(OUT, "MEMORY_RELEVANCE_PRODUCTION_LADDER.json");

const APEX_GENERIC =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;
const DOCTRINE_DUMP =
  /\*\*Event-state reading:\*\*|refund, return, chargeback, compensation, (?:or )?SLA failure does not by itself|later refund alone does not erase/i;
const LIVE_LEAK = /\bMini Fan\b|\bBirth\b|\bGrand King\b|sales-history evidence beyond realised/i;

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
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    kind: body.result?.kind ?? null,
    ms: Date.now() - t0,
  };
}

const TRIALS = [
  {
    id: "MR_irrelevant_semi",
    class: "irrelevant_temptation",
    message: [
      "SyntheticMR-01 — semiconductor fab analysis only. Do not mention Mini Fan or Birth.",
      "Line Cobalt currently satisfies every eligibility gate and is currently eligible.",
      "Earlier today Line Cobalt had a temporary process issue that has cleared.",
      "Workload was redirected from Line Cobalt to Line Argon after the earlier issue.",
      "Line Argon's current capacity constraint resulted from that redirected workload.",
      "Historical occurrence of the earlier issue is recorded; current state is clear.",
      "No commercial refund, chargeback, or economic reversal is in the pack.",
      'Assess: "Line Argon problem is unrelated to Line Cobalt because Line Argon has no process issue."',
      "Answer with conclusions, causal chain, and an explicit claim verdict.",
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "MR_relevant_hospitality",
    class: "relevant_application",
    message: [
      "SyntheticMR-02 — hospitality analysis only. Do not mention Mini Fan or Birth.",
      "Stays completed and recorded complete. Later full refund after service breach.",
      "Does the later refund erase that the earlier verified stays historically occurred?",
      "Answer briefly with the occurrence vs economic reading.",
    ].join("\n"),
    forbidDoctrine: false,
    requireOccurrencePrinciple: true,
  },
  {
    id: "MR_multipart_ops",
    class: "multipart",
    message: [
      "SyntheticMR-03 — operations brief only. Do not mention Mini Fan or Birth.",
      "1) Current eligibility of Depot Ridge.",
      "2) Historical note: temporary shortage cleared yesterday.",
      "3) Separate verdict: Forecast equals realised (forecast 4000, realised 900).",
      "Depot Ridge currently satisfies every eligibility gate.",
      "No refund is discussed.",
    ].join("\n"),
    forbidDoctrine: true,
  },
  {
    id: "MR_simple",
    class: "simple",
    message: [
      "SyntheticMR-04 — energy ops only. Do not mention Mini Fan or Birth.",
      "Node Cedar is currently eligible. Summarize eligibility in two sentences. No refund.",
    ].join("\n"),
    forbidDoctrine: true,
  },
  {
    id: "MR_timestamp",
    class: "timestamp_heavy",
    message: [
      "SyntheticMR-05 — logistics chronology only. Do not mention Mini Fan or Birth.",
      "2026-08-20 09:00 — Shipment K cleared origin.",
      "2026-08-21 14:00 — Shipment K delivered.",
      "2026-08-22 10:00 — Current status: closed.",
      "Answer: was delivery completed, and what is current status? No refund.",
    ].join("\n"),
    forbidDoctrine: true,
  },
  {
    id: "MR_claim_verdict",
    class: "claim_verdict",
    message: [
      "SyntheticMR-06 — registry analysis only. Do not mention Mini Fan or Birth.",
      "Verified asset registry: QR-17 = North Basin Module. QR-19 = Partner Frame. Distinct.",
      'Separate verdict on: "QR-17 is Partner Frame."',
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "MR_causal",
    class: "causal",
    message: [
      "SyntheticMR-07 — healthcare staffing only. Do not mention Mini Fan or Birth.",
      "Clinic West had an earlier staffing shortage. Work was reassigned to Clinic East.",
      "Clinic East's current capacity shortage resulted from that reassignment.",
      "Clinic East never had an operator shortage.",
      'Assess: "Clinic East shortage is unrelated to Clinic West because Clinic East never had an operator shortage."',
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "MR_decision",
    class: "decision",
    message: [
      "SyntheticMR-08 — retail ops decision only. Do not mention Mini Fan or Birth.",
      "Store Mesa currently eligible. Inventory gate PASS. Staffing gate PASS.",
      "Recommend whether to open the next shift under current constraints.",
      "No refund or economic reversal is in scope.",
    ].join("\n"),
    forbidDoctrine: true,
  },
];

function grade(trial, text) {
  const reasons = [];
  if (trial.forbidDoctrine) {
    if (APEX_GENERIC.test(text)) reasons.push("APEX_GENERIC_DOCTRINE");
    if (DOCTRINE_DUMP.test(text)) reasons.push("DOCTRINE_DUMP");
  }
  if (LIVE_LEAK.test(text)) reasons.push("LIVE_LEAK");
  if (trial.requireOccurrencePrinciple) {
    if (!/historically occurred|does not by itself erase|occurrence/i.test(text)) {
      reasons.push("MISSING_OCCURRENCE_PRINCIPLE");
    }
    if (/\*\*Event-state reading:\*\*/i.test(text)) reasons.push("EVENT_STATE_DUMP");
  }
  if (trial.expectContradicted) {
    if (!/\*\*Verdict:\*\*\s*(?:\*\*)?Contradicted\b|Contradicted/i.test(text)) {
      reasons.push("EXPECTED_CONTRADICTED");
    }
  }
  return reasons;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || health.gitCommitSha || "");
  const deploymentId = String(health.deploy?.deploymentId || health.deploymentId || "");

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

  const results = [];
  let pass = 0;
  let irrelevantLeak = 0;
  for (const t of TRIALS) {
    const sessionId = `mr-${t.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const r = await chat(cookie, sessionId, t.message);
    const reasons = [];
    if (!(r.status >= 200 && r.status < 300)) reasons.push(`http_${r.status}`);
    if (r.kind === "terminal_infrastructure") reasons.push("terminal");
    if (!r.text) reasons.push("EMPTY");
    reasons.push(...grade(t, r.text));
    if (t.forbidDoctrine && (APEX_GENERIC.test(r.text) || DOCTRINE_DUMP.test(r.text))) {
      irrelevantLeak += 1;
    }
    const ok = reasons.length === 0;
    if (ok) pass += 1;
    results.push({
      id: t.id,
      class: t.class,
      ok,
      reasons,
      ms: r.ms,
      preview: r.text.slice(0, 900),
    });
    console.log(JSON.stringify({ id: t.id, ok, reasons, ms: r.ms }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    liveSha,
    deploymentId,
    trials: results.length,
    pass,
    passRate: `${pass}/${results.length}`,
    IRRELEVANT_VISIBLE_DOCTRINE: irrelevantLeak,
    results,
    wave1: "UNCERTIFIED",
    wave1CleanStreak: 0,
    wave2: "UNCERTIFIED",
    wave3: "LOCKED",
    birthAuthorised: "NO",
    birthTimestamp: null,
  };
  writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log("WROTE", EVIDENCE);
  console.log(
    JSON.stringify({
      PRODUCTION_FIRST_VISIBLE_VALIDATION: pass === results.length && irrelevantLeak === 0 ? "PASS" : "FAIL",
      IRRELEVANT_VISIBLE_DOCTRINE: irrelevantLeak,
      FINAL_UNCHANGED_LIVE_SHA: liveSha || null,
      DEPLOYMENT_ID: deploymentId,
    }),
  );
  process.exit(pass === results.length && irrelevantLeak === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
