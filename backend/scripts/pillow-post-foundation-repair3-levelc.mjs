/**
 * Post-Foundation Repair 3 — Level C production first-request trials.
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
  if (!c.allowGovernance && GOV.test(visible)) reasons.push("governance");
  if (visible.length < 80) reasons.push("too_short");
  for (const f of c.forbid || []) if (f.test(visible)) reasons.push(`forbidden:${f}`);
  for (const r of c.require || []) if (!r.test(visible)) reasons.push(`missing:${r}`);
  if (c.minClaims) {
    const hits = (visible.match(/claim\s*\d|###\s*Claim|\*\*Verdict:\*\*/gi) || []).length;
    if (hits < c.minClaims) reasons.push(`claim_coverage:${hits}<${c.minClaims}`);
  }
  if (c.exactSections) {
    const markers = sectionMarkers(visible);
    const dups = markers.filter((n, i) => markers.indexOf(n) !== i);
    if (dups.length) reasons.push(`dup_sections:${[...new Set(dups)].join(",")}`);
    if (markers.length < c.exactSections) reasons.push(`sections:${markers.length}<${c.exactSections}`);
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
    message: [
      "SyntheticCanaryRepair3-C1 — analysis only for a hypothetical logistics company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.",
      "Pack: 22 shipments were physically completed and recorded complete. Later, full refunds were issued because a service requirement was breached.",
      "1) Did the shipments historically occur?",
      "2) What does the later refund change?",
      "3) Does the refund alone prove non-occurrence?",
    ].join("\n"),
    require: [/occur|complet|histor/i, /refund|economic|outcome/i],
    forbid: [ERASURE, LIVE],
  },
  {
    id: "CASE2_invalidating_evidence",
    message: [
      "SyntheticCanaryRepair3-C2 — analysis only. Do not mention Mini Fan or Birth.",
      "Pack: a completion record exists, but later verified audit shows the entry was fraudulent and never executed.",
      "1) May historical occurrence be invalidated?",
      "2) Why is this different from a mere refund?",
    ].join("\n"),
    require: [/fraud|void|never executed|invalid/i],
    forbid: [LIVE],
  },
  {
    id: "CASE3_five_claims",
    message: [
      "SyntheticCanaryRepair3-C3 — analysis only. Provide a separate verdict on each of the five quoted claims. Do not mention EmpireAI live products or Birth.",
      `1. "Forecast revenue reaches $3600."`,
      `2. "Later realised ledger shows $540."`,
      `3. "Node Quill and Part Meridian are the same entity because they co-occur."`,
      `4. "Supplier growth of +10% is established."`,
      `5. "Independent study +15% outweighs the supplier claim."`,
    ].join("\n"),
    require: [/forecast|estimate/i, /realised|ledger/i, /identity|co-occurr|entity/i, /supplier/i, /independent/i],
    forbid: [LIVE, ERASURE],
    minClaims: 4,
  },
  {
    id: "CASE4_seven_claims_one_unknown",
    message: [
      "SyntheticCanaryRepair3-C4 — separate verdict on each of the seven quoted claims. Do not mention Birth or Mini Fan.",
      `1. "Forecast $2100."`,
      `2. "Realised $380."`,
      `3. "Customer count equals order count."`,
      `4. "KEEL equals Riven by co-occurrence."`,
      `5. "Supplier +9% stands."`,
      `6. "Independent +14% outweighs supplier."`,
      `7. "Later registry globally erases all prior notes."`,
      "Note: pack omits customer and order counts for claim 3 — mark locally unknown if needed.",
    ].join("\n"),
    require: [/unknown|omit|not (?:stated|provided)|cannot/i, /forecast|estimate/i, /identity|co-occurr/i],
    forbid: [LIVE],
    minClaims: 5,
  },
  {
    id: "CASE5_hospitality_language_purity",
    message: [
      "SyntheticCanaryRepair3-C5 — analysis only for a hypothetical hospitality company.",
      "Classify whether a lone forecast bound of $880 is realised revenue. Two short paragraphs.",
      "Do not mention EmpireAI live products, Birth, Mini Fan, commissioning, or sales-history wording.",
    ].join("\n"),
    require: [/forecast|estimate|realised|unproven|unsupported/i],
    forbid: [/sales-history/i, /realised orders/i, LIVE],
  },
  {
    id: "CASE6_exact_seven_sections",
    message: [
      "SyntheticCanaryRepair3-C6 — analysis only. Answer in exactly 7 numbered sections.",
      "Pack: forecast $2700; realised $620; co-occurrence of ZX-Alpha and QR-91; supplier +8%; independent +13%; later registry for ZX-Alpha.",
      "Cover unknown counts, forecast vs realised, identity, provenance, supersession, unknowns, synthesis.",
      "Do not mention Mini Fan or Birth.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|co-occurr/i, /supersed|synthes/i],
    forbid: [LIVE],
    exactSections: 5,
  },
  {
    id: "CASE7_combined",
    message: [
      "SyntheticCanaryRepair3-C7 — analysis only for a hypothetical manufacturing company. Do not mention EmpireAI products or Birth.",
      "Pack: 15 units were completed and recorded complete; later full refunds after quality failure; forecast $4200; realised $700; KEEL co-occurs with Riven.",
      "1) Historical occurrence vs later refund.",
      "2) Forecast vs realised.",
      "3) Identity of KEEL vs Riven.",
      "4) Executive synthesis.",
    ].join("\n"),
    require: [/occur|complet|refund/i, /forecast|estimate/i, /identity|co-occurr/i],
    forbid: [ERASURE, LIVE],
  },
  {
    id: "CASE8_simple_control",
    message:
      'SyntheticCanaryRepair3-C8 — scenario-only. Is "Service Riven will succeed commercially" established from the claim alone? Two sentences. Do not mention EmpireAI live products, Birth, or Mini Fan.',
    require: [/unproven|unsupported|not established|scenario|claim/i],
    forbid: [LIVE, ERASURE],
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
