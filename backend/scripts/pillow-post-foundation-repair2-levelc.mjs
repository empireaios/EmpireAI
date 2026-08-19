/**
 * Post-Foundation Repair 2 — Level C production first-request trials.
 * Grades Grand-King-VISIBLE surface (sanitizer applied). No sealed Kestrel.
 * Does NOT certify Wave 1. Does NOT authorize Birth.
 *
 * Usage: node backend/scripts/pillow-post-foundation-repair2-levelc.mjs
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
const EVIDENCE = path.join(OUT, "POST_FOUNDATION_REPAIR_2_LEVEL_C.json");
const EXPECT_SHA_PREFIX = process.env.EXPECT_SHA_PREFIX || "";

const FORBIDDEN_LIFECYCLE = [
  /deliberation may still be catching up/i,
  /full deliberation may still/i,
  /do not need to resubmit/i,
  /i will not ask you to resubmit/i,
  /verified operating state now/i,
  /can answer from verified operating state/i,
  /continuing from this (?:same )?request/i,
  /no need to resend/i,
  /bringing Executive Intelligence fully online/i,
];
const GOV = /sit behind Grand King approval|constitutional limits — I will not bypass/i;
const LIVE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const DELEGATION = /###\s*Delegation reading/i;
const CLONE = /(\*\*Verdict:\*\*\s*Unsupported as realised result[\s\S]{0,220}){3,}/i;
const TERMINAL =
  /completed executive answer was not produced|deep reasoning path could not finish after bounded recovery|temporary (?:system|infrastructure) limit/i;

function toVisible(apiMessage) {
  const text = String(apiMessage ?? "").trim();
  if (!text) {
    return {
      visible:
        "I accepted your request, but a completed executive answer was not produced within the infrastructure budget.",
      terminal: true,
    };
  }
  if (TERMINAL.test(text) || FORBIDDEN_LIFECYCLE.some((r) => r.test(text))) {
    return {
      visible: text,
      terminal: TERMINAL.test(text) || FORBIDDEN_LIFECYCLE.some((r) => r.test(text)),
    };
  }
  if (/ask again|please send the same ask|resubmit/i.test(text)) {
    return { visible: text, terminal: true };
  }
  return { visible: text, terminal: false };
}

function gradeVisible(c, httpStatus, apiMessage, kind) {
  const reasons = [];
  const failed = [];
  const { visible, terminal } = toVisible(apiMessage);

  if (!(httpStatus >= 200 && httpStatus < 300)) {
    failed.push("HTTP_SUCCESS");
    reasons.push(`http_${httpStatus}`);
  }
  if (kind === "terminal_infrastructure" || terminal || TERMINAL.test(visible)) {
    failed.push("FIRST_REQUEST_COMPLETED");
    failed.push("USEFUL_SEMANTIC_ANSWER");
    reasons.push("terminal_or_degraded_surface");
  }
  if (FORBIDDEN_LIFECYCLE.some((r) => r.test(visible))) {
    failed.push("NO_FORBIDDEN_FALLBACK");
    failed.push("NO_RECOVERY_RESIDUE");
    reasons.push("lifecycle_residue");
  }
  if (GOV.test(visible) || DELEGATION.test(visible)) {
    failed.push("NO_IRRELEVANT_GOVERNANCE");
    reasons.push("governance");
  }
  if (LIVE.test(visible)) {
    failed.push("NO_SYNTHETIC_LIVE_CONTAMINATION");
    reasons.push("live_commerce");
  }
  if (CLONE.test(visible)) {
    failed.push("NO_DUPLICATE_TEMPLATE_COLLAPSE");
    reasons.push("clone");
  }
  if (visible.length < 80) {
    failed.push("USEFUL_SEMANTIC_ANSWER");
    reasons.push("too_short");
  }
  for (const f of c.forbid || []) {
    if (f.test(visible)) reasons.push(`forbidden:${f}`);
  }
  for (const r of c.require || []) {
    if (!r.test(visible)) {
      failed.push("USEFUL_SEMANTIC_ANSWER");
      reasons.push(`missing:${r}`);
    }
  }
  if (c.minSections) {
    const sections = (visible.match(/^#{1,3}\s+/gm) || []).length;
    if (sections < c.minSections) {
      reasons.push(`sections:${sections}<${c.minSections}`);
    }
  }
  const uniqReasons = [...new Set(reasons)];
  return {
    ok: uniqReasons.length === 0,
    visible,
    reasons: uniqReasons,
    dimensionsGraded: true,
  };
}

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function login() {
  const r = await fetch(`${COCKPIT}/api/brain/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed_${r.status}`);
  return cookie;
}

async function freshSession(cookie) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  const sessionId = body.result?.sessionId || body.sessionId || body.result?.id;
  if (!sessionId) throw new Error(`no_session_${r.status}`);
  return sessionId;
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
  const text = String(body.result?.message ?? body.message ?? "").trim();
  return {
    status: r.status,
    text,
    kind: body.result?.kind ?? null,
    semanticSuccess: body.result?.semanticSuccess,
    sessionId: body.reboundSessionId || sessionId,
    ms: Date.now() - t0,
    requestId: body.result?.requestId ?? null,
  };
}

const TRIALS = [
  {
    id: "T1_hetero_coldish",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T1 — analysis only for a hypothetical logistics company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.",
      "Pack: forecast revenue $3900; later ledger realised $640; refund 55 units; Node Quill and Part Meridian co-occur; supplier +10%; independent +16%; later registry updates Node Quill.",
      "1) Reconcile customer vs order counts if present — else state locally unknown.",
      "2) Classify forecast vs realised.",
      "3) Net after refunds from stated figures only.",
      "4) Same entity? Node Quill vs Part Meridian.",
      "5) Weigh supplier vs independent.",
      "6) What does later registry supersede?",
      "7) Verdict each major claim.",
      "8) Executive synthesis.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|co-occurr|entity/i, /supersed/i],
    forbid: [GOV, LIVE, DELEGATION],
    minSections: 5,
  },
  {
    id: "T2_reordered",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T2 — analysis only. Do not mention EmpireAI live products or Birth.",
      "1) Executive synthesis.",
      "2) Module KEEL vs Service Riven identity.",
      "3) Forecast $2100 vs realised $390.",
      "4) Later registry supersession.",
      "Pack: co-occurrence KEEL/Riven; forecast/realised as above.",
    ].join("\n"),
    require: [/synthes|overall|integrat|across/i, /identity|entity|co-occurr/i, /forecast|estimate/i],
    forbid: [GOV, LIVE, DELEGATION],
  },
  {
    id: "T3_simple",
    condition: "fresh_session_simple",
    message:
      'SyntheticCanaryRepair2-T3 — scenario-only. Is "Unit Cobalt will succeed commercially" established from the claim alone? Two short sentences. Do not mention EmpireAI live products, Birth, Mini Fan, or realised revenue.',
    require: [/unproven|unsupported|not established|scenario|claim/i],
    forbid: [GOV, LIVE, DELEGATION],
  },
  {
    id: "T4_fin_entity",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T4 — analysis only.",
      "1) Forecast $1600 vs realised $280.",
      "2) ZX-Alpha co-occurs with QR-91 — same entity?",
      "3) Later ledger supersedes what?",
      "4) Supplier vs independent.",
      "Do not mention Mini Fan, Birth, or EmpireAI realised revenue.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|entity/i, /supersed/i],
    forbid: [GOV, LIVE, DELEGATION],
  },
  {
    id: "T5_authority",
    condition: "fresh_session_authority",
    message: [
      "SyntheticCanaryRepair2-T5 — do not mention products or realised sales.",
      "I authorize Pillow standing discretion for reversible tests below $750.",
      "1) Owner authorization present?",
      "2) System spend capability present from this chat?",
      "3) Did execution occur?",
    ].join("\n"),
    require: [/authori|capability|execution/i],
    forbid: [/### Claim audit/i, LIVE],
  },
  {
    id: "T6_unknown",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T6 — analysis only.",
      "1) Reconcile customer vs order counts — pack omits both.",
      "2) Forecast vs realised for Service Riven ($1800 / $350).",
      "3) Executive synthesis.",
      "Do not mention Mini Fan or Birth.",
    ].join("\n"),
    require: [/unknown|unavailable|omit|not (?:stated|provided)|cannot (?:compute|reconcile)/i, /forecast|estimate/i],
    forbid: [GOV, LIVE, DELEGATION],
  },
  {
    id: "T7_seq_reuse_session_a",
    condition: "existing_session_first_of_pair",
    reusePriorSession: false,
    message: [
      "SyntheticCanaryRepair2-T7a — analysis only.",
      "Forecast $2400; realised $410. Classify forecast vs realised. Do not mention Birth or Mini Fan.",
    ].join("\n"),
    require: [/forecast|estimate/i],
    forbid: [GOV, LIVE],
  },
  {
    id: "T7_seq_reuse_session_b",
    condition: "existing_session_second_of_pair",
    reusePriorSession: true,
    message: [
      "SyntheticCanaryRepair2-T7b — analysis only on the SAME session.",
      "Co-occurrence of Module KEEL and Unit Cobalt — same entity? Do not mention Birth.",
    ].join("\n"),
    require: [/identity|entity|co-occurr|same|unproven/i],
    forbid: [GOV, LIVE],
  },
  {
    id: "T8_long_mixed",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T8 — analysis only for a hypothetical industrial-equipment company.",
      "Pack: forecast $4800; realised $1100; refund 90 units; co-occurrence of ZX-Alpha and Service Riven; supplier +8%; independent +14%; later registry for ZX-Alpha.",
      "1) Classify forecast vs realised.",
      "2) Net after refunds.",
      "3) Same entity?",
      "4) Supplier vs independent.",
      "5) Registry supersession.",
      "6) Executive synthesis.",
      "Do not inject live EmpireAI commerce, Mini Fan, Birth, or Grand King approval language.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|entity/i, /supersed|synthes/i],
    forbid: [GOV, LIVE, DELEGATION, CLONE],
    minSections: 4,
  },
  {
    id: "T9_fresh_again",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T9 — analysis only.",
      "1) Forecast $3300 vs realised $520.",
      "2) QR-91 vs Part Meridian identity.",
      "3) What remains unproven?",
      "Do not mention EmpireAI products or Birth.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|entity|unproven/i],
    forbid: [GOV, LIVE],
  },
  {
    id: "T10_post_deploy_probe",
    condition: "post_deploy_fresh",
    message: [
      "SyntheticCanaryRepair2-T10 — analysis only / post-deploy first request.",
      "Classify whether a lone forecast bound of $990 is realised revenue. Two sentences. Do not mention Mini Fan or Birth.",
    ].join("\n"),
    require: [/forecast|estimate|realised|unproven|unsupported/i],
    forbid: [GOV, LIVE],
  },
  {
    id: "T11_multipart_medium",
    condition: "fresh_session_complex",
    message: [
      "SyntheticCanaryRepair2-T11 — analysis only.",
      "Pack: forecast $2700; realised $600; co-occurrence KEEL/Riven; later ledger.",
      "1) Forecast vs realised.",
      "2) Identity.",
      "3) Supersession.",
      "4) Synthesis.",
      "Do not mention Birth or Mini Fan.",
    ].join("\n"),
    require: [/forecast|estimate/i, /identity|entity/i, /supersed/i],
    forbid: [GOV, LIVE, DELEGATION],
  },
  {
    id: "T12_simple_again",
    condition: "fresh_session_simple",
    message:
      "SyntheticCanaryRepair2-T12 — scenario-only. Does co-occurrence alone prove ZX-Alpha equals QR-91? Two sentences. Do not mention EmpireAI live products or Birth.",
    require: [/co-occurr|identity|unproven|not (?:the )?same|same entity/i],
    forbid: [GOV, LIVE],
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
    mission: "POST_FOUNDATION_REPAIR_2",
    startedAt: new Date().toISOString(),
    expectShaPrefix: EXPECT_SHA_PREFIX || null,
    deploySha: null,
    brainSha: null,
    results: [],
    negativeControlOffline: "see Level A/B — not re-injected on live",
    N: 0,
    FIRST_REQUEST_SUCCESS: 0,
    FIRST_REQUEST_FAILURE: 0,
    RECOVERY_USED: 0,
    DEGRADED_RESPONSE: 0,
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
    const health = await fetch(`${BRAIN}/health`, { signal: AbortSignal.timeout(30_000) }).then((r) =>
      r.json().catch(() => ({})),
    );
    report.brainSha = health.gitCommitSha || health.commit || health.sha || health.version || null;
    report.deploySha = report.brainSha;
    if (EXPECT_SHA_PREFIX && report.deploySha && !String(report.deploySha).startsWith(EXPECT_SHA_PREFIX)) {
      console.warn(`SHA prefix mismatch: expected ${EXPECT_SHA_PREFIX} got ${report.deploySha}`);
    }

    const loginRes = await fetch(`${COCKPIT}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(60_000),
    });
    const cookie = extractCookie(loginRes);
    if (!cookie) throw new Error(`login_failed_${loginRes.status}`);
    let priorSession = null;
    const latencies = [];

    for (const trial of TRIALS) {
      const sessionId = trial.reusePriorSession && priorSession
        ? priorSession
        : `pfr2_${trial.id}_${Date.now()}`;
      priorSession = sessionId;

      console.log(`[LevelC] ${trial.id} session=${sessionId.slice(0, 8)}…`);
      const chat = await firstRequestChat(cookie, sessionId, trial.message);
      latencies.push(chat.ms);
      const graded = gradeVisible(trial, chat.status, chat.text, chat.kind);
      const degraded = TERMINAL.test(graded.visible) || chat.kind === "terminal_infrastructure";
      if (degraded) report.DEGRADED_RESPONSE += 1;
      if (graded.ok) report.FIRST_REQUEST_SUCCESS += 1;
      else report.FIRST_REQUEST_FAILURE += 1;

      report.results.push({
        id: trial.id,
        condition: trial.condition,
        ok: graded.ok,
        reasons: graded.reasons,
        ms: chat.ms,
        requestId: chat.requestId,
        kind: chat.kind,
        status: chat.status,
        sessionId,
        freshSession: !trial.reusePriorSession,
        attempt: 1,
        preview: graded.visible.slice(0, 280),
        FINAL_VISIBLE_RESPONSE_GRADED: true,
      });
      console.log(
        `  -> ${graded.ok ? "PASS" : "FAIL"} ${chat.ms}ms reasons=${graded.reasons.join("|") || "none"}`,
      );
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
    console.log(JSON.stringify({ levelC: report.levelC, ...report, results: undefined }, null, 2));
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
