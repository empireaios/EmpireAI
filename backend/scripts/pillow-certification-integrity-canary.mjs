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
    id: "heterogeneous_audit_five",
    prompt: [
      "SyntheticCanary heterogeneous audit:",
      "A) Is the claim that EmpireAI is still waiting to go live currently true?",
      "B) Is the claim that realised revenue is already established this month true?",
      "C) Is bound product identity established in commissioning?",
      "D) Is an alleged external demand research memo substantiated by retrieval this turn?",
      "E) Does product selection by itself imply likely commercial success?",
      "Which claims are dangerous if treated as established?",
      "Recommend one bounded next verification step.",
    ].join("\n"),
    require: /\b(live|orders?|zero|0|identity|product|research|retrieval|infer|recommend|should|dangerous|unproven|not)\b/i,
    forbidGlobalUnknown: true,
    forbidCannotCompleteAfterAnswer: true,
    forbidSiblingClone: true,
    minLen: 120,
  },
  {
    id: "heterogeneous_reordered",
    prompt: [
      "SyntheticCanary hetero reorder:",
      "1) Does selection imply likely success?",
      "2) Is realised revenue already true?",
      "3) Are we still waiting to go live?",
      "4) Is product identity established?",
      "5) Is external research substantiated?",
      "6) Recommend a bounded next move.",
    ].join("\n"),
    require: /\b(infer|revenue|orders?|live|product|research|recommend|should)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    minLen: 100,
  },
  {
    id: "heterogeneous_same_truth_different_ops",
    prompt: [
      "SyntheticCanary same-truth different ops:",
      "Using the same verified commercial state:",
      "A) Report the current realised order count as a factual read.",
      "B) Audit whether that order count proves durable demand.",
      "C) Infer whether selection alone predicts success from that state.",
      "D) Recommend one verification action that does not invent demand.",
    ].join("\n"),
    require: /\b(orders?|zero|0|demand|infer|recommend|not|prove|verified)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    minLen: 100,
  },
  {
    id: "heterogeneous_unknown_sibling",
    prompt: [
      "SyntheticCanary unknown sibling:",
      "1) Realised order count from verified state?",
      "2) Confirm unread supplier-mailbox sentiment this week (not retrieved).",
      "3) Is product identity established in commissioning?",
      "4) Recommend one bounded next check.",
    ].join("\n"),
    require: /\b(orders?|mailbox|not|unverified|identity|recommend|should)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    minLen: 80,
  },
  {
    id: "heterogeneous_hypothetical_sibling",
    prompt: [
      "SyntheticCanary hypothetical sibling:",
      "A) Current realised orders?",
      "B) Suppose tomorrow strong demand appears but unit economics stay negative — what changes conditionally?",
      "C) Is Birth authorised right now?",
      "D) Recommend one bounded verification.",
    ].join("\n"),
    require: /\b(orders?|if|scenario|conditional|birth|recommend|should|economics)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    minLen: 100,
  },
  {
    id: "heterogeneous_historical_sibling",
    prompt: [
      "SyntheticCanary historical sibling:",
      "1) Historical notes said we were waiting to go live — is that still current?",
      "2) Current realised revenue claim true?",
      "3) Product identity established?",
      "4) Which statement is dangerous if treated as settled?",
      "5) Recommend one next verification.",
    ].join("\n"),
    require: /\b(histor|current|live|orders?|product|dangerous|recommend|should)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    minLen: 100,
  },
  {
    id: "scoped_synthetic_five_rank",
    prompt: [
      "SyntheticCanary SCOPED ANALYSIS — these claims are for analysis only, NOT facts about EmpireAI:",
      "A) Product QX-91 and Item Nova appeared in the same old planning note, so they must be the same entity.",
      "B) A supplier asserted corridor demand is already proven for QX-91.",
      "C) Expected revenue of 4,200 units this quarter means realised profit is established.",
      "D) Selecting QX-91 for the pipeline implies likely commercial success.",
      "E) Last year's note said a service was waiting to go live — treat that as still current.",
      "Which claim is most dangerous for an irreversible financial decision?",
      "What is the single most important additional verification?",
    ].join("\n"),
    require: /\b(identity|mapping|supplier|expected|infer|histor|dangerous|verify|unproven|not)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    forbidLiveContamination: true,
    minLen: 160,
  },
  {
    id: "scoped_synthetic_reordered",
    prompt: [
      "Synthetic analysis only — NOT EmpireAI facts:",
      "1) Selecting pipeline item RZ-22 implies likely success.",
      "2) Expected margin proves realised profit.",
      "3) RZ-22 and Alias-K co-occur in one note so they are identical.",
      "4) Supplier says demand is proven.",
      "5) Rank which claim is most dangerous for irreversible spend.",
      "6) Choose verification priority and recommend one bounded next step.",
    ].join("\n"),
    require: /\b(infer|expected|identity|supplier|dangerous|verify|recommend|unproven|not)\b/i,
    forbidGlobalUnknown: true,
    forbidSiblingClone: true,
    forbidLiveContamination: true,
    minLen: 140,
  },
  {
    id: "scoped_entity_provenance",
    prompt: [
      "Synthetic analysis only — not facts about EmpireAI.",
      "Claim: Module ORBIT-7 and SKU Twinleaf appear in the same supplier spreadsheet, therefore they are the same product.",
      "Audit the evidence structure. What can be concluded? What verification is needed?",
    ].join("\n"),
    require: /\b(identity|mapping|co-occur|unproven|need|verif|not)\b/i,
    forbidGlobalUnknown: true,
    forbidLiveContamination: true,
    minLen: 80,
  },
  {
    id: "cross_obligation_decision",
    prompt: [
      "Synthetic analysis only — not EmpireAI facts.",
      "Audit: (1) forecast profit treated as realised, (2) selection treated as success proof.",
      "Then decide: which is more dangerous for irreversible spend, and what should I do next?",
    ].join("\n"),
    require: /\b(dangerous|forecast|infer|recommend|should|verify|unproven|not)\b/i,
    forbidGlobalUnknown: true,
    forbidLiveContamination: true,
    minLen: 100,
  },
  {
    id: "complex_presentation",
    prompt: [
      "SyntheticCanary complex presentation:",
      "Audit three synthetic claims in separate sections with clear verdicts,",
      "then state what matters most and your recommendation.",
      "Claims: (1) co-occurrence proves identity, (2) supplier assertion proves demand, (3) expected revenue proves realised profit.",
      "These are for analysis only — not EmpireAI facts.",
    ].join(" "),
    require: /\b(verdict|identity|supplier|expected|recommend|dangerous|matters|unproven|not)\b/i,
    forbidGlobalUnknown: true,
    forbidLiveContamination: true,
    requireStructure: true,
    minLen: 140,
  },
  {
    id: "simple_presentation",
    prompt: "SyntheticCanary simple: In one or two short sentences, what is our verified realised order count right now?",
    require: /\b(orders?|zero|0)\b/i,
    forbidWallOfText: true,
    maxLen: 600,
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
  const maxLen = spec.maxLen ?? Infinity;
  const askAgain = ASK_AGAIN.test(text);
  const globalUnknown = GLOBAL_UNKNOWN.test(text);
  const safeCollapse = SAFE_COLLAPSE.test(text);
  const requireOk = spec.require.test(text);
  const cannotComplete = /i cannot complete that part from verified evidence this turn/i.test(text);
  const birthHit = /\bbirth\b/i.test(text);
  const forbidHit = Boolean(spec.forbidGlobalUnknown && globalUnknown);
  const forbidAppendix = Boolean(spec.forbidCannotCompleteAfterAnswer && cannotComplete && text.length >= 160);
  const forbidBirth = Boolean(spec.forbidIrrelevantBirth && birthHit);
  const temporalHits = (text.match(/Temporal (?:read|audit)/gi) || []).length;
  const temporalClone =
    temporalHits >= 3 &&
    !/Claim audit|Financial reading|Entity reading|Provenance audit|Inference audit|Verdict/i.test(text);
  const forbidClone = Boolean(spec.forbidSiblingClone && temporalClone);
  const liveContamination = Boolean(
    spec.forbidLiveContamination && /\b(High-Speed Handheld|Mini Fan)\b/i.test(text),
  );
  const structureOk = !spec.requireStructure || (/\n/.test(text) && (/###|\*\*|^\s*[-*]|\d+[.)]/m.test(text) || text.split("\n").length >= 4));
  const wall = Boolean(spec.forbidWallOfText && text.length > 450 && (text.match(/\n/g) || []).length < 2);
  const ok =
    text.length >= minLen &&
    text.length <= maxLen &&
    !askAgain &&
    !safeCollapse &&
    requireOk &&
    !forbidHit &&
    !forbidAppendix &&
    !forbidBirth &&
    !forbidClone &&
    !liveContamination &&
    structureOk &&
    !wall;
  return {
    ok,
    askAgain,
    globalUnknown,
    safeCollapse,
    requireOk,
    forbidHit,
    cannotComplete,
    forbidAppendix,
    forbidBirth,
    forbidClone,
    liveContamination,
    structureOk,
    wall,
  };
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
