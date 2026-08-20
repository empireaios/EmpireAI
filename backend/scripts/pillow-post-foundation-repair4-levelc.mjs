/**
 * Post-Foundation Repair 4 — Level C production first-request trials.
 * Grades Grand-King-visible surface. No sealed Ardent/Lumen. No Wave certification.
 *
 * Usage: node backend/scripts/pillow-post-foundation-repair4-levelc.mjs
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
const EVIDENCE = path.join(OUT, "POST_FOUNDATION_REPAIR_4_LEVEL_C.json");
const EXPECT_SHA_PREFIX = process.env.EXPECT_SHA_PREFIX || "";

const FORBIDDEN_LIFECYCLE = [
  /deliberation may still be catching up/i,
  /verified operating state now/i,
  /do not need to resubmit/i,
  /sales-history evidence beyond realised orders/i,
];
const ERASURE = /should not be counted as historically (?:completed|occurred)/i;
const LIVE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const GOV = /sit behind Grand King approval|constitutional limits — I will not bypass/i;
const TERMINAL = /completed executive answer was not produced|temporary system limit/i;
const DOCTRINE = /\*\*Event-state reading:\*\*|chargeback, compensation, SLA breach/i;
const SOURCE_DOMAIN = /sales-history evidence|realised orders/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function claimMarkers(text) {
  return [...String(text).matchAll(/(?:^|\n)\s*(?:#{1,3}\s*)?Claim\s*(\d+)\b/gi)].map((m) =>
    Number(m[1]),
  );
}

function grade(c, status, text, kind) {
  const reasons = [];
  const visible = String(text || "").trim();
  if (!(status >= 200 && status < 300)) reasons.push(`http_${status}`);
  if (kind === "terminal_infrastructure" || TERMINAL.test(visible)) {
    reasons.push("terminal_or_degraded_surface");
  }
  for (const f of FORBIDDEN_LIFECYCLE) if (f.test(visible)) reasons.push(`lifecycle:${f}`);
  if (ERASURE.test(visible)) reasons.push("historical_erasure");
  if (LIVE.test(visible)) reasons.push("live_commerce");
  if (DOCTRINE.test(visible)) reasons.push("lesson_text_dump");
  if (SOURCE_DOMAIN.test(visible)) reasons.push("source_domain_leak");
  if (!c.allowGovernance && GOV.test(visible)) reasons.push("governance");
  if (visible.length < 80) reasons.push("too_short");
  for (const f of c.forbid || []) if (f.test(visible)) reasons.push(`forbidden:${f}`);
  for (const r of c.require || []) if (!r.test(visible)) reasons.push(`missing:${r}`);
  if (c.exactClaims) {
    const markers = claimMarkers(visible);
    const set = new Set(markers);
    for (let i = 1; i <= c.exactClaims; i++) {
      if (!set.has(i)) reasons.push(`missing_claim_${i}`);
    }
    const dups = markers.filter((n, i) => markers.indexOf(n) !== i);
    if (dups.length) reasons.push(`dup_claims:${[...new Set(dups)].join(",")}`);
  }
  if (c.forbidSupportedIdentity) {
    if (/Claim\s*1[\s\S]{0,320}\*\*Verdict:\*\*\s*Supported/i.test(visible)) {
      reasons.push("identity_claim_wrongly_supported");
    }
  }
  return { ok: reasons.length === 0, reasons, visible };
}

async function firstRequestChat(cookie, sessionId, message) {
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
    requestId: body.result?.requestId ?? null,
  };
}

const TRIALS = [
  {
    id: "CASE1_five_claims_middle_financial",
    message: [
      "SyntheticCanaryRepair4-C1 — analysis only for a hypothetical hospitality company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.",
      "Pack: forecast occupancy revenue $4200; realised ledger $610; HT-88 = Hillside Transit Hotel; Harbour Crown = HC-11 (distinct).",
      "Provide a separate verdict on each of the five quoted claims in original order:",
      `1. "Forecast revenue reaches $4200."`,
      `2. "Later realised ledger shows $610."`,
      `3. "HT-88 is Harbour Crown Hotel."`,
      `4. "Independent rating +12% outweighs supplier."`,
      `5. "The completed stay never historically occurred because of a later refund."`,
    ].join("\n"),
    require: [/forecast|estimate/i, /realised|ledger/i, /Claim\s*2/i],
    forbid: [LIVE, ERASURE, DOCTRINE, SOURCE_DOMAIN],
    exactClaims: 5,
    forbidSupportedIdentity: true,
  },
  {
    id: "CASE2_seven_claims",
    message: [
      "SyntheticCanaryRepair4-C2 — analysis only. Provide a separate verdict on each of the seven quoted claims in original order. Do not mention Birth or Mini Fan.",
      `1. "Forecast $2500."`,
      `2. "Realised $440."`,
      `3. "Room-nights equal unique guests."`,
      `4. "PX-41 equals Bayline Residence by co-occurrence."`,
      `5. "Supplier +9% stands."`,
      `6. "Independent +14% outweighs supplier."`,
      `7. "Later registry globally erases all prior notes."`,
    ].join("\n"),
    require: [/Claim\s*1/i, /Claim\s*4/i, /Claim\s*7/i],
    forbid: [LIVE, SOURCE_DOMAIN],
    exactClaims: 7,
  },
  {
    id: "CASE3_entity_conclusion_later_challenged",
    message: [
      "SyntheticCanaryRepair4-C3 — hospitality analysis only. Do not mention Mini Fan or Birth.",
      "1) From the property registry: HT-88 is Hillside Transit Hotel; Harbour Crown Hotel is HC-11; they are distinct.",
      "2) Then provide a separate verdict on each quoted claim:",
      `1. "HT-88 is Harbour Crown Hotel."`,
      `2. "Forecast equals realised."`,
    ].join("\n"),
    require: [/Hillside|distinct|Contradict/i, /Claim\s*1/i],
    forbid: [LIVE, /Claim\s*1[\s\S]{0,280}\*\*Verdict:\*\*\s*Supported/i],
    exactClaims: 2,
    forbidSupportedIdentity: true,
  },
  {
    id: "CASE4_financial_conclusion_later_challenged",
    message: [
      "SyntheticCanaryRepair4-C4 — analysis only. Do not mention Mini Fan or Birth.",
      "1) Reconcile: forecast $3000 vs realised $520 — they are not equal.",
      "2) Separate verdicts:",
      `1. "Forecast revenue is realised."`,
      `2. "Supplier growth claim stands."`,
    ].join("\n"),
    require: [/forecast|estimate/i, /Claim\s*1/i],
    forbid: [LIVE, /Claim\s*1[\s\S]{0,280}\*\*Verdict:\*\*\s*Supported/i],
    exactClaims: 2,
  },
  {
    id: "CASE5_one_unknown_claim",
    message: [
      "SyntheticCanaryRepair4-C5 — separate verdict on each of the five quoted claims. Do not mention Birth or Mini Fan.",
      `1. "Forecast $1800."`,
      `2. "Realised $310."`,
      `3. "Customer count equals order count."`,
      `4. "Supplier +8% stands."`,
      `5. "Independent +13% outweighs supplier."`,
      "Note: pack omits customer and order counts for claim 3 — mark that claim locally unknown/not established if needed. Do not omit Claim 3.",
    ].join("\n"),
    require: [/Claim\s*3/i, /unknown|not established|unproven|omit|not (?:stated|provided)/i],
    forbid: [LIVE],
    exactClaims: 5,
  },
  {
    id: "CASE6_non_commerce_domain",
    message: [
      "SyntheticCanaryRepair4-C6 — analysis only for a hypothetical healthcare clinic. Do not mention EmpireAI live products, Birth, Mini Fan, commissioning, or sales-history wording.",
      "Pack: forecast patient visits 900; realised visits 210; care episodes completed then later compensation after a service issue.",
      "1) Forecast vs realised visits.",
      "2) Did care episodes historically occur despite later compensation?",
      "3) Two-paragraph executive synthesis.",
    ].join("\n"),
    require: [/forecast|visit|patient|occur|complet/i],
    forbid: [LIVE, SOURCE_DOMAIN, DOCTRINE, ERASURE],
  },
  {
    id: "CASE7_multi_section_repeated_propositions",
    message: [
      "SyntheticCanaryRepair4-C7 — analysis only. Answer in exactly 6 numbered sections. Do not mention Mini Fan or Birth.",
      "Pack: forecast $2700; realised $620; HT-77 = Cedar Transit Lodge; Harbour Crown = HC-11 (distinct); stays completed then refunded after breach.",
      "Cover: forecast vs realised; identity; occurrence vs refund; then claim audit of:",
      `1. "HT-77 is Harbour Crown Hotel."`,
      `2. "Forecast equals realised."`,
      `3. "The stay never historically occurred because of the refund."`,
      "Then unknowns and synthesis. Reuse earlier conclusions — do not reverse them.",
    ].join("\n"),
    require: [/forecast|estimate/i, /Claim\s*1/i, /Claim\s*2/i, /Claim\s*3/i],
    forbid: [LIVE, SOURCE_DOMAIN, DOCTRINE, ERASURE],
    exactClaims: 3,
    forbidSupportedIdentity: true,
  },
  {
    id: "CASE8_simple_control",
    message:
      'SyntheticCanaryRepair4-C8 — scenario-only. Is "Service Riven will succeed commercially" established from the claim alone? Two sentences. Do not mention EmpireAI live products, Birth, or Mini Fan.',
    require: [/unproven|unsupported|not established|scenario|claim/i],
    forbid: [LIVE, ERASURE, SOURCE_DOMAIN],
  },
];

function pct(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "POST_FOUNDATION_REPAIR_4",
    startedAt: new Date().toISOString(),
    expectShaPrefix: EXPECT_SHA_PREFIX || null,
    deploySha: null,
    brainSha: null,
    frontendSha: null,
    results: [],
    N: 0,
    FIRST_REQUEST_SUCCESS: 0,
    FIRST_REQUEST_FAILURE: 0,
    p50: null,
    p95: null,
    max: null,
    WAVE_1: "UNCERTIFIED",
    WAVE_1_CLEAN_STREAK: 0,
    WAVE_2: "UNCERTIFIED",
    WAVE_3: "LOCKED",
    BIRTH_AUTHORISED: "NO",
    BIRTH_TIMESTAMP: null,
  };

  try {
    const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(30_000) }).then(
      (r) => r.json().catch(() => ({})),
    );
    report.brainSha = health.deploy?.gitCommitSha || null;
    try {
      const stamp = await fetch(`${COCKPIT}/api/eos-bundle-stamp`, {
        signal: AbortSignal.timeout(20_000),
      }).then((r) => r.json());
      report.frontendSha = stamp.gitCommitSha || null;
    } catch {
      report.frontendSha = null;
    }
    report.deploySha = report.brainSha || report.frontendSha;

    const loginRes = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(60_000),
    });
    const cookie = extractCookie(loginRes);
    if (!cookie) throw new Error(`login_failed_${loginRes.status}`);

    const latencies = [];
    for (const trial of TRIALS) {
      const sessionId = `pfr4_${trial.id}_${Date.now()}`;
      console.log(`[LevelC] ${trial.id}`);
      const chat = await firstRequestChat(cookie, sessionId, trial.message);
      latencies.push(chat.ms);
      const g = grade(trial, chat.status, chat.text, chat.kind);
      if (g.ok) report.FIRST_REQUEST_SUCCESS += 1;
      else report.FIRST_REQUEST_FAILURE += 1;
      report.results.push({
        id: trial.id,
        ok: g.ok,
        reasons: g.reasons,
        ms: chat.ms,
        requestId: chat.requestId,
        kind: chat.kind,
        status: chat.status,
        sessionId,
        attempt: 1,
        preview: g.visible.slice(0, 280),
        FINAL_VISIBLE_RESPONSE_GRADED: true,
      });
      console.log(`  -> ${g.ok ? "PASS" : "FAIL"} ${chat.ms}ms ${g.reasons.join("|") || "none"}`);
    }

    report.N = report.results.length;
    const sorted = [...latencies].sort((a, b) => a - b);
    report.p50 = pct(sorted, 50);
    report.p95 = pct(sorted, 95);
    report.max = sorted[sorted.length - 1] ?? null;
    report.finishedAt = new Date().toISOString();
    report.levelC =
      report.FIRST_REQUEST_FAILURE === 0 && report.FIRST_REQUEST_SUCCESS === report.N ? "PASS" : "FAIL";
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify(
        { levelC: report.levelC, N: report.N, fail: report.FIRST_REQUEST_FAILURE, sha: report.deploySha },
        null,
        2,
      ),
    );
    process.exit(report.levelC === "PASS" ? 0 : 1);
  } catch (err) {
    report.error = String(err?.stack || err);
    report.levelC = "FAIL";
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.error(err);
    process.exit(1);
  }
}

main();
