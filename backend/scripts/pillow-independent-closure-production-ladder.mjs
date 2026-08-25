/**
 * Combined independent-closure production first-visible ladder.
 * New scenarios only. No sealed exams. No Wave certification.
 * Combines memory relevance + claim verdict + causality + timestamps + structure.
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
const EVIDENCE = path.join(OUT, "INDEPENDENT_CLOSURE_PRODUCTION_COMBINED_LADDER.json");

const APEX_GENERIC =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;
const DOCTRINE_DUMP =
  /\*\*Event-state reading:\*\*|Do not select on price alone:\s*require a clear refund\/returns policy|Net-after-refund conclusions need explicit gross|refund quantity or amount|perform only the arithmetic the pack supports/i;
const LIVE_LEAK =
  /\bMini Fan\b|\bBirth\b|sales-history evidence beyond realised|verified sales-history/i;

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

function hasContradicted(text) {
  return (
    /\*\*Verdict:\*\*\s*(?:\*\*)?Contradicted\b/i.test(text) ||
    /\b(?:claim\s+is\s+)?(?:\*\*)?contradicted(?:\*\*)?\b/i.test(text)
  );
}

const TRIALS = [
  {
    id: "IC_mem_causal_soft",
    class: "memory+causality+verdict",
    message: [
      "SyntheticIC-P01 — energy grid analysis only. Do not mention Mini Fan or Birth.",
      "Node Prism had a thermal trip. Work was reassigned from Prism to Nexus.",
      "Nexus capacity was committed to the reassigned load. Nexus current capacity shortage resulted from that commitment.",
      "Nexus never had a thermal trip.",
      "No commercial refund is in the pack.",
      "Answer with conclusions first. Then assess this claim:",
      "Nexus capacity shortage has no causal relationship to Prism because Nexus never had a thermal trip.",
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "IC_mem_claim_registry",
    class: "memory+claim_verdict",
    message: [
      "SyntheticIC-P02 — asset registry only. Do not mention Mini Fan or Birth.",
      "Verified registry: LM-44 = Lakeside Module. LM-55 = Partner Frame. Distinct.",
      "No refund.",
      'Separate verdict on: "LM-44 is Partner Frame."',
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "IC_causal_current_state",
    class: "causality+current_historical",
    message: [
      "SyntheticIC-P03 — hospitality ops only. Do not mention Mini Fan or Birth.",
      "Lodge Cedar had earlier staffing shortage that cleared. Cedar is currently eligible.",
      "Work redirected from Cedar to Harbor. Harbor current bed shortage resulted from that redirect.",
      "Harbor never had a staffing shortage.",
      "Assess this claim:",
      "Harbor bed shortage is unrelated to Cedar because Harbor never had a staffing shortage.",
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
  {
    id: "IC_timestamps_multipart",
    class: "timestamps+structure",
    message: [
      "SyntheticIC-P04 — logistics chronology only. Do not mention Mini Fan or Birth.",
      "1) Was delivery completed?",
      "2) What is current status?",
      "2026-08-20 09:00 — Shipment R cleared origin.",
      "2026-08-21 14:00 — Shipment R delivered.",
      "2026-08-22 10:00 — Current status: closed.",
      "No refund.",
    ].join("\n"),
    forbidDoctrine: true,
    forbidFabricatedTasks: true,
  },
  {
    id: "IC_population_forecast",
    class: "population+forecast",
    message: [
      "SyntheticIC-P05 — laboratory measurement only. Do not mention Mini Fan or Birth.",
      "Subset n=60 of population M=600 measured 9%. Forecast throughput 5000; realised 1100.",
      "Provide separate verdicts on:",
      '1. "The full population rate is 9%."',
      '2. "Forecast equals realised."',
    ].join("\n"),
    forbidDoctrine: true,
    expectMultiClaim: 2,
    forbidSupportedOnBoth: true,
  },
  {
    id: "IC_synthetic_isolation",
    class: "synthetic+memory",
    message: [
      "SyntheticIC-P06 — retail ops brief only. Do not mention Mini Fan or Birth.",
      "Store Mesa currently eligible. Inventory gate PASS.",
      "Summarize eligibility in two sentences. No refund.",
    ].join("\n"),
    forbidDoctrine: true,
  },
  {
    id: "IC_claim_completeness",
    class: "claim_completeness+consistency",
    message: [
      "SyntheticIC-P07 — transport registry only. Do not mention Mini Fan or Birth.",
      "Provide a separate verdict on each quoted claim:",
      '1. "Forecast equals realised."',
      '2. "TR-21 is Harbour Crown Depot."',
      '3. "Deliveries never historically occurred because of a later refund."',
      "Pack: TR-21 = Tri-Ridge Depot from registry; distinct from Harbour Crown. Forecast 3000 realised 800. Deliveries completed; later refund for one lot.",
    ].join("\n"),
    forbidDoctrine: false,
    expectMultiClaim: 3,
  },
  {
    id: "IC_compound_unrelated",
    class: "causality+compound_claim",
    message: [
      "SyntheticIC-P08 — manufacturing transfer only. Do not mention Mini Fan or Birth.",
      "Line Quay had a seal failure. Work redirected to Line Cobalt. Cobalt technician shortage resulted from that redirect.",
      "Cobalt never had a seal failure.",
      'Separate verdict on: "Cobalt has a different direct cause, therefore Cobalt is unrelated to Quay."',
    ].join("\n"),
    forbidDoctrine: true,
    expectContradicted: true,
  },
];

function grade(trial, text) {
  const reasons = [];
  if (trial.forbidDoctrine) {
    if (APEX_GENERIC.test(text)) reasons.push("APEX_GENERIC_DOCTRINE");
    if (DOCTRINE_DUMP.test(text)) reasons.push("DOCTRINE_DUMP");
  }
  if (LIVE_LEAK.test(text)) reasons.push("LIVE_LEAK");
  if (trial.forbidFabricatedTasks) {
    if (/\bTask\s*\d+\b.{0,40}\d{1,2}:\d{2}/i.test(text)) reasons.push("FABRICATED_TIMESTAMP_TASK");
  }
  if (trial.expectContradicted && !hasContradicted(text)) {
    reasons.push("EXPECTED_CONTRADICTED");
  }
  if (trial.expectMultiClaim) {
    for (let i = 1; i <= trial.expectMultiClaim; i++) {
      if (!new RegExp(`Claim\\s*${i}[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*`, "i").test(text)) {
        reasons.push(`MISSING_CLAIM_${i}`);
      }
    }
  }
  if (trial.forbidSupportedOnBoth) {
    const supported = (text.match(/\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/gi) || []).length;
    if (supported >= 2) reasons.push("BOTH_CLAIMS_SUPPORTED");
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
  let verdictMismatch = 0;
  for (const t of TRIALS) {
    const sessionId = `ic-${t.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const r = await chat(cookie, sessionId, t.message);
    const reasons = [];
    if (!(r.status >= 200 && r.status < 300)) reasons.push(`http_${r.status}`);
    if (r.kind === "terminal_infrastructure") reasons.push("terminal");
    if (!r.text) reasons.push("EMPTY");
    reasons.push(...grade(t, r.text));
    if (t.forbidDoctrine && (APEX_GENERIC.test(r.text) || DOCTRINE_DUMP.test(r.text))) {
      irrelevantLeak += 1;
    }
    if (t.expectContradicted && /\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/i.test(r.text)) {
      verdictMismatch += 1;
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
    FINAL_VERDICT_MISMATCH: verdictMismatch,
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
      PRODUCTION_FIRST_VISIBLE_VALIDATION:
        pass === results.length && irrelevantLeak === 0 && verdictMismatch === 0 ? "PASS" : "FAIL",
      IRRELEVANT_VISIBLE_DOCTRINE: irrelevantLeak,
      FINAL_VERDICT_MISMATCH: verdictMismatch,
      FINAL_UNCHANGED_LIVE_SHA: liveSha || null,
      DEPLOYMENT_ID: deploymentId,
    }),
  );
  process.exit(pass === results.length && irrelevantLeak === 0 && verdictMismatch === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
