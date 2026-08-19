/**
 * Post-Foundation Repair 3 — Level C live first-request trials.
 * Grades Grand-King-visible surface. No sealed Lumen. No Wave certification.
 *
 * Usage: node backend/scripts/pillow-post-foundation-repair3-levelc.mjs
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
const EVIDENCE = path.join(OUT, "POST_FOUNDATION_REPAIR_3_LEVEL_C.json");
const EXPECT_SHA_PREFIX = process.env.EXPECT_SHA_PREFIX || "";

const ERASURE =
  /should not be counted as historically (?:completed|occurred)|never (?:historically )?(?:occurred|completed) because .{0,40}refund/i;
const SALES_LEAK =
  /sales-history evidence|realised orders|verified operating state now|commissioning\/KPI state/i;
const SOFT =
  /deliberation may still be catching up|do not need to resubmit|I will not ask you to resubmit/i;
const GOV = /sit behind Grand King approval|###\s*Delegation reading/i;
const LIVE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function sectionMarkers(text) {
  return [...String(text).matchAll(/^\s*(\d{1,2})[.)]\s+\S/gm)].map((m) => Number(m[1]));
}

function grade(c, httpStatus, text) {
  const reasons = [];
  const visible = String(text || "").trim();
  if (!(httpStatus >= 200 && httpStatus < 300)) reasons.push(`http_${httpStatus}`);
  if (visible.length < 60) reasons.push("too_short");
  if (SOFT.test(visible)) reasons.push("soft_fallback");
  if (ERASURE.test(visible) && c.forbidErasure) reasons.push("historical_erasure");
  if (SALES_LEAK.test(visible) && c.forbidSalesLeak) reasons.push("source_domain_leak");
  if (GOV.test(visible) && !c.allowGov) reasons.push("governance");
  if (LIVE.test(visible)) reasons.push("live_commerce");
  for (const f of c.forbid || []) if (f.test(visible)) reasons.push(`forbidden:${f}`);
  for (const r of c.require || []) if (!r.test(visible)) reasons.push(`missing:${r}`);
  if (c.expectedSections) {
    const markers = sectionMarkers(visible);
    const dups = markers.filter((n, i) => markers.indexOf(n) !== i);
    if (dups.length) reasons.push(`dup_sections:${dups.join(",")}`);
    if (markers.length < c.expectedSections && !/section contract|missing section/i.test(visible)) {
      // Allow honest shortfall note; otherwise require enough markers
      if (markers.length < Math.max(3, c.expectedSections - 2)) {
        reasons.push(`sections:${markers.length}<${c.expectedSections}`);
      }
    }
  }
  if (c.minClaimSignals) {
    const hits = (visible.match(/claim\s*\d|###\s*Claim|\*\*Verdict:\*\*/gi) || []).length;
    if (hits < c.minClaimSignals) reasons.push(`claim_signals:${hits}<${c.minClaimSignals}`);
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
    id: "CASE1_occurrence_then_refund",
    forbidErasure: true,
    forbidSalesLeak: true,
    message: [
      "SyntheticCanaryRepair3-C1 — analysis only for a hypothetical logistics company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.",
      "Pack: 22 route completions were physically completed and recorded complete. Later, full refunds were issued because a service requirement was breached.",
      "1) Did the route completions historically occur?",
      "2) What does the later refund change (economic vs occurrence)?",
      "3) Does the refund alone prove non-occurrence?",
    ].join("\n"),
    require: [/occur|complet|histor/i, /refund|economic|outcome/i],
  },
  {
    id: "CASE2_invalidating_evidence",
    forbidErasure: false,
    forbidSalesLeak: true,
    message: [
      "SyntheticCanaryRepair3-C2 — analysis only. Do not mention Mini Fan or Birth.",
      "Pack: a completion record exists, but later verified audit proves the entry was fraudulent and never executed.",
      "1) May historical occurrence be invalidated?",
      "2) What evidence class allows that?",
    ].join("\n"),
    require: [/fraud|invalid|never executed|void|erroneous/i],
  },
  {
    id: "CASE3_five_claims",
    forbidSalesLeak: true,
    minClaimSignals: 4,
    message: [
      "SyntheticCanaryRepair3-C3 — analysis only. Provide a separate verdict on each of the five quoted claims. Do not mention EmpireAI live products or Birth.",
      `1. "Forecast revenue reaches $3600."`,
      `2. "Later realised ledger shows $540."`,
      `3. "Node Quill and Part Meridian are the same entity because they co-occur."`,
      `4. "Supplier growth of +10% is established."`,
      `5. "Independent study +15% outweighs the supplier claim."`,
    ].join("\n"),
    require: [/forecast|estimate/i, /realised|ledger/i, /identity|co-occurr|entity/i],
  },
  {
    id: "CASE4_seven_claims_one_unknown",
    forbidSalesLeak: true,
    minClaimSignals: 5,
    message: [
      "SyntheticCanaryRepair3-C4 — separate verdict on each of the seven quoted claims. One may be UNKNOWN. Do not mention Birth.",
      `1. "Forecast $2100 is realised."`,
      `2. "Realised ledger $380 is established."`,
      `3. "KEEL equals Riven by co-occurrence."`,
      `4. "Supplier +9% stands alone."`,
      `5. "Independent +14% is stronger provenance."`,
      `6. "Customer count equals order count (both omitted)."`,
      `7. "Later registry supersedes all prior notes globally."`,
    ].join("\n"),
    require: [/unknown|omit|not (?:stated|provided)|cannot/i, /forecast|estimate|identity|supersed/i],
  },
  {
    id: "CASE5_hospitality_language_purity",
    forbidSalesLeak: true,
    message: [
      "SyntheticCanaryRepair3-C5 — analysis only for a hypothetical hospitality company.",
      "Classify whether a lone forecast bound of $880 is realised revenue. Two short paragraphs.",
      "Do not mention EmpireAI live products, Birth, Mini Fan, commissioning, or KPI state.",
    ].join("\n"),
    require: [/forecast|estimate|realised|unproven|unsupported/i],
    forbid: [/sales-history|realised orders|commissioning\/KPI/i],
  },
  {
    id: "CASE6_exact_seven_sections",
    forbidSalesLeak: true,
    expectedSections: 7,
    message: [
      "SyntheticCanaryRepair3-C6 — analysis only. Answer in exactly 7 numbered sections.",
      "Pack: forecast $2700; realised $610; co-occurrence of ZX-Alpha and QR-91; supplier +8%; independent +13%; later registry for ZX-Alpha.",
      "Cover: unknown counts, forecast vs realised, identity, provenance, supersession, unknowns, synthesis.",
      "Do not mention Mini Fan or Birth.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|co-occurr/i, /supersed|synthes/i],
  },
  {
    id: "CASE7_combined",
    forbidErasure: true,
    forbidSalesLeak: true,
    message: [
      "SyntheticCanaryRepair3-C7 — analysis only for industrial equipment. Do not mention EmpireAI products or Birth.",
      "Pack: 15 installations completed and recorded; later full refunds after SLA breach; forecast $4500; realised $900; Unit Cobalt co-occurs with Part Meridian.",
      "1) Historical occurrence vs later refund.",
      "2) Forecast vs realised.",
      "3) Entity identity.",
      "4) Executive synthesis.",
    ].join("\n"),
    require: [/occur|complet|histor|refund/i, /forecast|estimate/i, /identity|entity/i],
  },
  {
    id: "CASE8_simple_control",
    forbidSalesLeak: true,
    message:
      'SyntheticCanaryRepair3-C8 — scenario-only. Is "Service Riven will succeed commercially" established from the claim alone? Two sentences. Do not mention EmpireAI live products, Birth, or Mini Fan.',
    require: [/unproven|unsupported|not established|scenario|claim/i],
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
    mission: "POST_FOUNDATION_REPAIR_3",
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
      const sessionId = `pfr3_${trial.id}_${Date.now()}`;
      console.log(`[LevelC] ${trial.id}`);
      const chat = await firstRequestChat(cookie, sessionId, trial.message);
      latencies.push(chat.ms);
      const graded = grade(trial, chat.status, chat.text);
      if (graded.ok) report.FIRST_REQUEST_SUCCESS += 1;
      else report.FIRST_REQUEST_FAILURE += 1;
      report.results.push({
        id: trial.id,
        ok: graded.ok,
        reasons: graded.reasons,
        ms: chat.ms,
        requestId: chat.requestId,
        kind: chat.kind,
        status: chat.status,
        sessionId,
        attempt: 1,
        preview: graded.visible.slice(0, 280),
        FINAL_VISIBLE_RESPONSE_GRADED: true,
      });
      console.log(`  -> ${graded.ok ? "PASS" : "FAIL"} ${chat.ms}ms ${graded.reasons.join("|") || "none"}`);
    }

    report.N = report.results.length;
    const sorted = [...latencies].sort((a, b) => a - b);
    report.p50 = pct(sorted, 50);
    report.p95 = pct(sorted, 95);
    report.max = sorted[sorted.length - 1] ?? null;
    report.finishedAt = new Date().toISOString();
    report.levelC =
      report.FIRST_REQUEST_FAILURE === 0 && report.FIRST_REQUEST_SUCCESS === report.N
        ? "PASS"
        : "FAIL";
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ levelC: report.levelC, N: report.N, fail: report.FIRST_REQUEST_FAILURE, sha: report.deploySha }, null, 2));
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
