/**
 * Level C — production final-visible-output canary (exact Grand King Cockpit path).
 *
 * Grades the SAME response representation Grand King receives via
 * POST /api/pillow/chat → result.message (final visible semantics).
 *
 * Does NOT encode sealed Wave 1 / Mini Fan content.
 * Does NOT rerun the 1000-response availability qualification.
 *
 * Env: EMPIRE_COCKPIT_URL, EMPIRE_LOGIN_EMAIL / EMPIRE_LOGIN_PASSWORD,
 *      EMPIRE_BRAIN_URL (optional, for deploy SHA)
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

const ASK_AGAIN =
  /\b(please ask again|ask again in a moment|realigning executive intelligence)\b/i;
const GLOBAL_UNKNOWN =
  /\bi don't have enough (?:solid )?evidence to (?:answer that confidently|give you a fuller operating narrative)\b/i;
const SAFE_COLLAPSE =
  /^EmpireAI is live and answering you in production right now\.\s*We're focused on .+\.\s*We haven't made our first sale yet\./i;

const SUITE = [
  {
    id: "simple_direct",
    prompt: "SyntheticCanary: What is our current verified product focus and realised order count?",
    require: /\b(focus|product|orders?|zero|0|live)\b/i,
  },
  {
    id: "follow_up_why",
    prompt: "SyntheticCanary follow-up: Why is that the verified commercial reading right now?",
    require: /\b(because|verified|orders?|commission|kpi|state|evidence|know)\b/i,
  },
  {
    id: "four_part_executive",
    prompt: [
      "SyntheticCanary 4-part executive request:",
      "1) Verified product focus?",
      "2) Realised orders and revenue?",
      "3) Audit the premise that external demand is already proven.",
      "4) Recommend one bounded next verification step.",
    ].join("\n"),
    require: /\b(focus|orders?|premise|recommend|unestablished|unproven|verify)\b/i,
    forbidGlobalUnknown: true,
    minLen: 80,
  },
  {
    id: "ten_part",
    prompt: [
      "SyntheticCanary 10-part:",
      ...Array.from({ length: 10 }, (_, i) => `${i + 1}) Brief verified note on theme ${i + 1}.`),
    ].join("\n"),
    require: /\b(1\)|theme|orders?|focus|verified)\b/i,
    forbidGlobalUnknown: true,
    minLen: 80,
  },
  {
    id: "premise_audit",
    prompt: [
      "SyntheticCanary premise audit — evaluate each:",
      "1) We already have realised revenue this month.",
      "2) Bound product identity is established in commissioning.",
      "3) An unread partner portal confirmed corridor strength.",
    ].join("\n"),
    require: /\b(premise|assumption|supported|unestablished|orders?|not treat|contradict)\b/i,
    forbidGlobalUnknown: true,
  },
  {
    id: "temporal_reconciliation",
    prompt:
      "SyntheticCanary temporal: Reconcile historical waiting-to-go-live notes with current live answering evidence and a future hypothetical first-sale state.",
    require: /\b(histor|current|future|supersed|live|reconcil)\b/i,
    forbidGlobalUnknown: true,
  },
  {
    id: "mixed_known_unknown",
    prompt: [
      "SyntheticCanary mixed:",
      "1) Realised order count?",
      "2) Confirm inbox sentiment from an unread supplier mailbox this week.",
      "3) Is Birth authorised?",
      "4) Recommend one next check.",
    ].join("\n"),
    require: /\b(orders?|birth|recommend|inbox|not|unverified|open|retrieved)\b/i,
    forbidGlobalUnknown: true,
  },
  {
    id: "recommendation",
    prompt:
      "SyntheticCanary: Given verified zero realised sales and unknown demand strength, recommend a bounded next verification — do not invent demand proof.",
    require: /\b(recommend|bounded|verify|verification-first|should)\b/i,
  },
  {
    id: "hypothetical_conditional",
    prompt: [
      "SyntheticCanary conditional:",
      "Current verified demand is unknown and realised orders are zero.",
      "Suppose tomorrow reliable evidence shows strong customer interest,",
      "but the product loses money on every completed order after variable selling costs.",
      "If that scenario held, how should the decision change? Give a conditional recommendation.",
    ].join(" "),
    require: /\b(under|if|scenario|would|assumption|conditional|recommend|should|economics|loss|scale)\b/i,
    forbidGlobalUnknown: true,
    forbidCannotCompleteAfterAnswer: true,
    minLen: 80,
  },
  {
    id: "coverage_non_interference",
    prompt: [
      "SyntheticCanary non-interference:",
      "Audit whether realised sales already prove success,",
      "reject unsupported prior-sales claims,",
      "and recommend one bounded next verification step.",
    ].join(" "),
    require: /\b(orders?|zero|0|recommend|verify|unproven|not|premise)\b/i,
    forbidGlobalUnknown: true,
    forbidCannotCompleteAfterAnswer: true,
    forbidIrrelevantBirth: true,
  },
  {
    id: "contradiction_pressure",
    prompt:
      "SyntheticCanary: A commercial position report says demand is proven fact and ROI is confirmed. Reconcile that with verified realised commerce and say what survives.",
    require: /\b(orders?|zero|0|unproven|not|verified|demand|survive|treat)\b/i,
    forbidGlobalUnknown: true,
  },
];

/** Two consecutive different intents on one session (same underlying truth). */
const CONSECUTIVE = [
  {
    id: "consec_a_briefing",
    prompt: "SyntheticCanary consecutive A: Short operating briefing from verified state only.",
    require: /\b(live|product|orders?|focus|birth)\b/i,
  },
  {
    id: "consec_b_temporal",
    prompt:
      "SyntheticCanary consecutive B: Reconcile historical pre-launch waiting notes with current live evidence and a future hypothetical first sale.",
    require: /\b(histor|current|future|live|supersed|reconcil)\b/i,
    forbidGlobalUnknown: true,
  },
  {
    id: "consec_c_recommend",
    prompt:
      "SyntheticCanary consecutive C: What should we do next as a bounded verification step?",
    require: /\b(recommend|should|next|verify|bounded)\b/i,
  },
];

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function grade(text, spec) {
  const minLen = spec.minLen ?? 40;
  const askAgain = ASK_AGAIN.test(text);
  const globalUnknown = GLOBAL_UNKNOWN.test(text);
  const safeCollapse = SAFE_COLLAPSE.test(text);
  const requireOk = spec.require.test(text);
  const forbidHit = Boolean(spec.forbidGlobalUnknown && globalUnknown);
  const ok =
    text.length >= minLen &&
    !askAgain &&
    !safeCollapse &&
    requireOk &&
    !forbidHit;
  return { ok, askAgain, globalUnknown, safeCollapse, requireOk, forbidHit, cannotComplete, forbidAppendix, forbidBirth };
}

async function chat(cookie, sessionId, message) {
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await r.json().catch(() => ({}));
  const text = String(body.result?.message ?? body.message ?? "").trim();
  return {
    status: r.status,
    text,
    sessionId: body.reboundSessionId || sessionId,
    artifactId: body.result?.artifactId ?? body.artifactId ?? null,
  };
}

async function main() {
  const report = {
    artifact: "PILLOW_CERTIFICATION_INTEGRITY_CANARY_LEVEL_C",
    startedAt: new Date().toISOString(),
    route: "POST /api/pillow/chat (Cockpit BFF → Pillow host)",
    gradesFinalVisible: true,
    sealedExamEncoded: false,
    cases: [],
    consecutive: [],
    askAgain: 0,
    globalUnknown: 0,
    safeCollapse: 0,
    failures: 0,
    consecutiveDistinct: null,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
    deploySha: null,
  };

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(55_000),
  });
  const cookie = extractCookie(login);
  if (!login.ok || !cookie) {
    console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
    process.exit(2);
  }

  let sessionId = null;
  for (let i = 0; i < 8; i++) {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    sessionId = sj.session?.sessionId ?? null;
    if (sess.ok && sessionId) break;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  if (!sessionId) {
    console.error(JSON.stringify({ pass: false, reason: "session" }));
    process.exit(2);
  }

  try {
    const live = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) });
    const lj = await live.json();
    report.deploySha = lj.deploy?.gitCommitSha ?? null;
  } catch {
    /* non-blocking */
  }

  for (const c of SUITE) {
    const res = await chat(cookie, sessionId, c.prompt);
    sessionId = res.sessionId;
    const g = grade(res.text, c);
    if (g.askAgain) report.askAgain += 1;
    if (g.globalUnknown) report.globalUnknown += 1;
    if (g.safeCollapse) report.safeCollapse += 1;
    if (!g.ok || res.status >= 400) report.failures += 1;
    report.cases.push({
      id: c.id,
      ok: g.ok && res.status < 400,
      status: res.status,
      artifactId: res.artifactId,
      ...g,
      preview: res.text.slice(0, 280),
    });
  }

  const consecTexts = [];
  for (const c of CONSECUTIVE) {
    const res = await chat(cookie, sessionId, c.prompt);
    sessionId = res.sessionId;
    const g = grade(res.text, c);
    consecTexts.push(res.text);
    if (g.askAgain) report.askAgain += 1;
    if (g.globalUnknown) report.globalUnknown += 1;
    if (g.safeCollapse) report.safeCollapse += 1;
    if (!g.ok || res.status >= 400) report.failures += 1;
    report.consecutive.push({
      id: c.id,
      ok: g.ok && res.status < 400,
      status: res.status,
      ...g,
      preview: res.text.slice(0, 280),
    });
  }
  const distinct =
    consecTexts.length >= 3 &&
    consecTexts[0] !== consecTexts[1] &&
    consecTexts[1] !== consecTexts[2];
  report.consecutiveDistinct = distinct;
  if (!distinct) report.failures += 1;

  report.completedAt = new Date().toISOString();
  report.result =
    report.failures === 0 &&
    report.askAgain === 0 &&
    report.globalUnknown === 0 &&
    report.safeCollapse === 0 &&
    report.consecutiveDistinct
      ? "PASS"
      : "FAIL";

  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_CERTIFICATION_INTEGRITY_CANARY_LEVEL_C.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        failures: report.failures,
        globalUnknown: report.globalUnknown,
        consecutiveDistinct: report.consecutiveDistinct,
        deploySha: report.deploySha,
        outPath,
      },
      null,
      2,
    ),
  );
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
