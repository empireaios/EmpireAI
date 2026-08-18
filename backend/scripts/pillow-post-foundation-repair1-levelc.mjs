/**
 * Post-Foundation Repair 1 — Level C live Cockpit canaries (synthetic only).
 * Does NOT replay Asteria / sealed Wave exams. Does NOT certify Wave 1.
 *
 * Usage: node backend/scripts/pillow-post-foundation-repair1-levelc.mjs
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
const EVIDENCE = path.join(OUT, "POST_FOUNDATION_REPAIR_1_LEVEL_C.json");
const EXPECT_SHA_PREFIX = process.env.EXPECT_SHA_PREFIX || "85a6500e";

const GOV = /sit behind Grand King approval|constitutional limits — I will not bypass/i;
const RESUBMIT = /do not need to resubmit/i;
const COMMERCE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const DELEGATION = /###\s*Delegation reading/i;
const CLONE_VERDICT = /(\*\*Verdict:\*\*\s*Unsupported as realised result[\s\S]{0,220}){3,}/i;

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

const CASES = [
  {
    id: "CASE1_hetero_8",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C1 — analysis only for a hypothetical logistics company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.",
      "Pack: forecast revenue $4200; later ledger realised $780; refund 75 units; ZX-Alpha and QR-91 co-occur in one planning note; supplier claims +11% growth; independent study cites +17%; later registry lists ZX-Alpha under a different code.",
      "1) Reconcile customer count vs order count if both appear — otherwise state what is locally unknown.",
      "2) Classify forecast vs realised revenue.",
      "3) Compute net after refunds from stated figures only.",
      "4) Decide whether ZX-Alpha and QR-91 are the same entity.",
      "5) Weigh supplier claim vs independent evidence.",
      "6) What does the later registry update supersede?",
      "7) Verdict each major claim separately.",
      "8) Executive synthesis across the above.",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION, CLONE_VERDICT],
    require: [/forecast|estimate/i, /identity|co-occurr|entity/i, /supersed/i, /refund|net|operand|arithmetic/i],
    minSections: 6,
  },
  {
    id: "CASE2_reordered",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C2 — analysis only. Do not mention EmpireAI live products or Birth.",
      "1) Executive synthesis across the pack.",
      "2) Decide whether Module KEEL and Service Riven are the same entity.",
      "3) Classify forecast vs realised revenue.",
      "4) What does the later registry update supersede?",
      "Pack: forecast $2400; realised $420; co-occurrence of KEEL and Riven; later registry update for KEEL.",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION, CLONE_VERDICT],
    require: [/synthes|overall|integrat|across/i, /identity|entity|co-occurr/i, /forecast|estimate/i, /supersed/i],
  },
  {
    id: "CASE3_fin_entity_temporal_prov",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C3 — analysis only.",
      "1) Classify forecast $1800 vs realised $310.",
      "2) Entity: Unit Cobalt co-occurs with Part Meridian — same entity?",
      "3) Later ledger supersedes what?",
      "4) Weigh supplier claim vs independent study.",
      "Do not mention Mini Fan, Birth, or EmpireAI realised revenue.",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION],
    require: [/forecast|estimate/i, /identity|entity/i, /supersed/i, /supplier|independent/i],
  },
  {
    id: "CASE4_money_no_authority",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C4 — evidence only. Historical forecast up to $1250; later realised $180.",
      "1) Classify the forecast.",
      "2) What remains unproven?",
      "Do not mention EmpireAI products or Birth.",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION, /###\s*Authority reading/i],
    require: [/forecast|estimate|unproven|unsupported/i],
  },
  {
    id: "CASE5_authority_still_works",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C5 — do not mention products or realised sales.",
      "I authorize Pillow standing discretion for reversible tests below $900.",
      "1) Is owner authorization present?",
      "2) Is system spend capability present from this chat?",
      "3) Did execution occur?",
    ].join("\n"),
    forbid: [/### Claim audit/i, COMMERCE, RESUBMIT],
    require: [/authori|capability|execution/i],
  },
  {
    id: "CASE6_simple_evidence",
    freshSession: true,
    message:
      'SyntheticCanaryRepair1-C6: In two short sentences, is "Service Riven will succeed commercially" established from the claim alone? Analysis only — no EmpireAI live state.',
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION],
    require: [/unproven|unsupported|not established|scenario|claim/i],
  },
  {
    id: "CASE7_unknown_sibling",
    freshSession: true,
    message: [
      "SyntheticCanaryRepair1-C7 — analysis only.",
      "1) Reconcile customer count vs order count — pack omits both counts.",
      "2) Classify forecast vs realised for Module KEEL ($2100 forecast / $400 realised).",
      "3) Executive synthesis.",
      "Do not mention Mini Fan or Birth.",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION],
    require: [/unknown|unavailable|omit|not (?:stated|provided)|cannot (?:compute|reconcile)/i, /forecast|estimate/i],
  },
  {
    id: "CASE8_long_mixed_synthesis",
    freshSession: false,
    message: [
      "SyntheticCanaryRepair1-C8 — continue analysis only on a fresh industrial-equipment pack.",
      "Forecast $5100; realised $1250; refund 120 units; co-occurrence of Node Quill and Part Meridian; supplier +9%; independent +15%; later registry for Node Quill.",
      "Answer 1–6 briefly then give a final synthesis. Do not inject live EmpireAI commerce or Grand King approval language.",
      "1) forecast vs realised 2) refund net 3) entity identity 4) supplier vs independent 5) supersession 6) synthesis",
    ].join("\n"),
    forbid: [GOV, RESUBMIT, COMMERCE, DELEGATION, CLONE_VERDICT],
    require: [/forecast|estimate/i, /identity|entity/i, /supersed|synthes/i],
  },
];

function grade(c, text) {
  const reasons = [];
  for (const f of c.forbid) if (f.test(text)) reasons.push(`forbidden:${f}`);
  for (const r of c.require) if (!r.test(text)) reasons.push(`missing:${r}`);
  if (c.minSections) {
    const sections = (text.match(/^#{1,3}\s+/gm) || []).length;
    if (sections < c.minSections) reasons.push(`sections:${sections}<${c.minSections}`);
  }
  if (text.length < 80) reasons.push("too_short");
  return reasons;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {
    mission: "POST_FOUNDATION_REPAIR_1",
    startedAt: new Date().toISOString(),
    expectShaPrefix: EXPECT_SHA_PREFIX,
    deploySha: null,
    results: [],
    fail: 0,
    WAVE_1_CURRENT_CERTIFICATION: "UNCERTIFIED",
    WAVE_1_CLEAN_STREAK: 0,
    WAVE_2_CURRENT_CERTIFICATION: "UNCERTIFIED",
    WAVE_3: "LOCKED",
    BIRTH_AUTHORISED: "NO",
    BIRTH_TIMESTAMP: null,
  };

  try {
    const health = await fetch(`${BRAIN}/health`, { signal: AbortSignal.timeout(30_000) });
    const hj = await health.json().catch(() => ({}));
    report.deploySha = hj.gitCommitSha || hj.commit || hj.sha || hj.version || null;
  } catch (e) {
    report.healthError = String(e?.message || e);
  }

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(login);
  if (!cookie) {
    report.fail = CASES.length;
    report.error = `login_failed status=${login.status}`;
    writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.error(report.error);
    process.exit(2);
  }

  let sessionId = `pfr1_${Date.now()}`;
  for (const c of CASES) {
    if (c.freshSession) sessionId = `pfr1_${c.id}_${Date.now()}`;
    const res = await chat(cookie, sessionId, c.message);
    sessionId = res.sessionId || sessionId;
    const reasons = res.status >= 400 ? [`http:${res.status}`] : grade(c, res.text);
    const ok = reasons.length === 0;
    if (!ok) report.fail += 1;
    report.results.push({
      id: c.id,
      ok,
      reasons,
      ms: res.ms,
      requestId: res.requestId,
      preview: res.text.slice(0, 400),
    });
    console.log(ok ? "PASS" : "FAIL", c.id, reasons.join("; ") || "", `${res.ms}ms`);
  }

  report.finishedAt = new Date().toISOString();
  report.pass = report.results.filter((r) => r.ok).length;
  writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log(`Wrote ${EVIDENCE}`);
  console.log(`PASS=${report.pass} FAIL=${report.fail} SHA=${report.deploySha}`);
  process.exit(report.fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
