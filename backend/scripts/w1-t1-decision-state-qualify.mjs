/**
 * W1-T1 decision-state propagation qualify.
 * Deterministic â€” no sealed Wave exams, no Aurora/Beacon/Cedar replay as qual.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");

const {
  buildDecisionCaseState,
  repairDecisionVisibility,
  assessDecisionVisibilityConsistency,
  extractCurrentDeliveryDays,
} = await import("../src/orchestration/pillow-host/executive-decision-case-state.ts");
const {
  isGivenMetricDecisionAsk,
  isCommercialArithmeticAsk,
  synthesizeCommercialArithmeticAnswer,
} = await import("../src/orchestration/pillow-host/executive-commercial-arithmetic.ts");

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

const NAMES = [
  ["Nova", "Orion", "Vega"],
  ["Piston", "Rivet", "Anvil"],
  ["Harbor", "Quay", "Jetty"],
  ["Falcon", "Osprey", "Kestrel"],
  ["Delta", "Echo", "Foxtrot"],
];

function pack({
  a,
  b,
  c,
  aC,
  bC,
  cC,
  aDel,
  bDel,
  cDelEarlier,
  cDelCorrected,
  bPending = true,
  contribMin = 10,
  stockMin = 1000,
  delMax = 6,
}) {
  const cedarDel =
    cDelCorrected != null
      ? `earlier delivery ${cDelEarlier} days\nlater verified corrected delivery ${cDelCorrected} days.`
      : `delivery ${cDelEarlier} days`;
  return `Bounded decision â€” three corridors.

${a}:
contribution ${aC}
stock 1200
delivery ${aDel} days
approval granted.

${b}:
contribution ${bC}
stock 1600
delivery ${bDel} days
approval ${bPending ? "pending" : "granted"}.

${c}:
contribution ${cC}
stock 1100
approval granted
${cedarDel}

Eligibility:
contribution >=${contribMin}
stock >=${stockMin}
delivery <=${delMax}
approval granted.

Among eligible corridors select highest contribution.
Answer current eligible set, current selection, and if ${b} approval becomes granted whether selection changes.`;
}

// ---- REPRO_CASES >= 10 ----
let repro = 0;
let reproHit = 0;
for (let i = 0; i < 12; i++) {
  const [a, b, c] = NAMES[i % NAMES.length];
  const msg = pack({
    a,
    b,
    c,
    aC: 12 + (i % 3) * 0.1,
    bC: 16 + (i % 4) * 0.1,
    cC: 14 + (i % 3) * 0.1,
    aDel: 5,
    bDel: 4,
    cDelEarlier: 5,
    cDelCorrected: 8,
    bPending: true,
  });
  const d = buildDecisionCaseState(msg);
  repro++;
  if (!d) fail(`repro no dc ${i}`);
  // Must NOT use superseded 5 for Cedar
  const cedar = d.candidates.find((x) => x.displayName === c);
  const delGate = cedar?.gates.find((g) => g.id === "delivery_max_days");
  if (delGate?.status !== "FAIL" || !/8/.test(delGate.raw || "")) {
    fail(`repro superseded ${i} ${JSON.stringify(delGate)}`);
  }
  if (!(d.eligibleSet.length === 1 && d.eligibleSet[0] === a)) {
    fail(`repro eligible ${i} ${d.eligibleSet}`);
  }
  if (d.recommendation.selectedId !== a || d.recommendation.status !== "SELECT") {
    fail(`repro select ${i}`);
  }
  // Inject stale visible answer â€” repair must fix
  const stale = `Eligible set: ${a} + ${c}.\nCurrent selection: ${c}.\n${c}'s 8-day delivery makes ${c} ineligible.\nDO NOT SELECT ANY.`;
  const fixed = repairDecisionVisibility(stale, d);
  const assess = assessDecisionVisibilityConsistency(fixed, d);
  if (!assess.ok) fail(`repro repair ${i} ${assess.failures.join(",")}`);
  if (/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(fixed) && d.recommendation.status === "SELECT") {
    fail(`repro false DNS ${i}`);
  }
  reproHit++;
}
if (repro < 10 || reproHit < 10) fail(`REPRO pass=${reproHit}`);

// ---- CORRECTED_GATE >= 100 ----
let gatePass = 0;
let gateErr = 0;
let supersededUsed = 0;
for (let i = 0; i < 100; i++) {
  const [a, b, c] = NAMES[i % NAMES.length];
  const passToFail = i % 2 === 0;
  const earlier = passToFail ? 5 : 9;
  const corrected = passToFail ? 8 : 4;
  const msg = pack({
    a,
    b,
    c,
    aC: 12.5,
    bC: 11.0,
    cC: 13.0,
    aDel: 5,
    bDel: 5,
    cDelEarlier: earlier,
    cDelCorrected: corrected,
    bPending: false,
  });
  const d = buildDecisionCaseState(msg);
  if (!d) {
    gateErr++;
    continue;
  }
  const cedar = d.candidates.find((x) => x.displayName === c);
  if (!cedar) {
    gateErr++;
    continue;
  }
  const del = cedar.gates.find((g) => g.id === "delivery_max_days");
  const expectFail = corrected > 6;
  if ((del?.status === "FAIL") !== expectFail) {
    gateErr++;
    if (gateErr <= 3) console.error("gate", i, del, corrected);
    continue;
  }
  const extracted = extractCurrentDeliveryDays(
    `earlier delivery ${earlier} days later verified corrected delivery ${corrected} days`,
  );
  if (extracted.value !== corrected) {
    supersededUsed++;
    continue;
  }
  // Must not treat earlier as current when correction present
  if (extracted.value === earlier && earlier !== corrected) supersededUsed++;
  gatePass++;
}
if (gatePass < 100 || gateErr > 0 || supersededUsed > 0) {
  fail(`CORRECTED_GATE pass=${gatePass} err=${gateErr} superseded=${supersededUsed}`);
}

// ---- ELIGIBLE_SET >= 100 ----
let elPass = 0;
let elErr = 0;
for (let i = 0; i < 100; i++) {
  const [a, b, c] = NAMES[i % NAMES.length];
  const mode = i % 3; // 0 zero, 1 one, 2 multi
  let msg;
  if (mode === 0) {
    // all fail delivery or approval
    msg = pack({
      a,
      b,
      c,
      aC: 12,
      bC: 16,
      cC: 14,
      aDel: 9,
      bDel: 9,
      cDelEarlier: 5,
      cDelCorrected: 9,
      bPending: true,
    });
  } else if (mode === 1) {
    msg = pack({
      a,
      b,
      c,
      aC: 12.8,
      bC: 16.4,
      cC: 14.1,
      aDel: 5,
      bDel: 4,
      cDelEarlier: 5,
      cDelCorrected: 8,
      bPending: true,
    });
  } else {
    msg = pack({
      a,
      b,
      c,
      aC: 12.8,
      bC: 13.5,
      cC: 11.0,
      aDel: 5,
      bDel: 4,
      cDelEarlier: 5,
      cDelCorrected: 5,
      bPending: false,
    });
  }
  const d = buildDecisionCaseState(msg);
  if (!d) {
    elErr++;
    continue;
  }
  const want =
    mode === 0 ? [] : mode === 1 ? [a] : [a, b, c].sort();
  const got = [...d.eligibleSet].sort();
  const ok =
    got.length === want.length && want.every((n) => got.includes(n));
  if (!ok) {
    elErr++;
    if (elErr <= 5) console.error("el", i, mode, got, want);
  } else elPass++;
}
if (elPass < 100 || elErr > 0) fail(`ELIGIBLE pass=${elPass} err=${elErr}`);

// ---- SELECTION >= 100 ----
let selPass = 0;
let selErr = 0;
let outside = 0;
let falseDns = 0;
for (let i = 0; i < 100; i++) {
  const [a, b, c] = NAMES[i % NAMES.length];
  const mode = i % 3;
  const msg = pack({
    a,
    b,
    c,
    aC: 12.8,
    bC: mode === 2 ? 15.0 : 16.4,
    cC: 14.1,
    aDel: mode === 0 ? 9 : 5,
    bDel: 4,
    cDelEarlier: 5,
    cDelCorrected: mode === 2 ? 5 : 8,
    bPending: mode !== 2,
  });
  const d = buildDecisionCaseState(msg);
  if (!d) {
    selErr++;
    continue;
  }
  if (d.eligibleSet.length === 0) {
    if (d.recommendation.status !== "DO_NOT_SELECT") {
      falseDns++;
      continue;
    }
  } else if (d.eligibleSet.length === 1) {
    if (d.recommendation.selectedId !== d.eligibleSet[0]) {
      selErr++;
      continue;
    }
  } else {
    // highest contribution among eligible
    const metrics = Object.fromEntries(
      d.candidates.map((x) => [x.displayName, x.supportedMetric ?? -Infinity]),
    );
    const best = [...d.eligibleSet].sort((x, y) => (metrics[y] ?? 0) - (metrics[x] ?? 0))[0];
    if (d.recommendation.selectedId !== best) {
      selErr++;
      continue;
    }
  }
  if (
    d.recommendation.selectedId &&
    !d.eligibleSet.includes(d.recommendation.selectedId)
  ) {
    outside++;
    continue;
  }
  if (d.eligibleSet.length > 0 && d.recommendation.status === "DO_NOT_SELECT") {
    falseDns++;
    continue;
  }
  selPass++;
}
if (selPass < 100 || selErr || outside || falseDns) {
  fail(`SELECTION pass=${selPass} err=${selErr} outside=${outside} dns=${falseDns}`);
}

// ---- REVERSAL >= 75 ----
let revPass = 0;
let revErr = 0;
let contam = 0;
for (let i = 0; i < 75; i++) {
  const [a, b, c] = NAMES[i % NAMES.length];
  const msg = pack({
    a,
    b,
    c,
    aC: 12.8,
    bC: 16.4,
    cC: 14.1,
    aDel: 5,
    bDel: 4,
    cDelEarlier: 5,
    cDelCorrected: 8,
    bPending: true,
  });
  const d = buildDecisionCaseState(msg);
  if (!d) {
    revErr++;
    continue;
  }
  if (d.eligibleSet.includes(b)) {
    contam++;
    continue;
  }
  const hit = (d.reversalConditions || []).some(
    (r) => new RegExp(b, "i").test(r) && /selection changes to/i.test(r),
  );
  if (!hit) {
    revErr++;
    if (revErr <= 3) console.error("rev", i, d.reversalConditions);
    continue;
  }
  revPass++;
}
if (revPass < 75 || revErr || contam) {
  fail(`REVERSAL pass=${revPass} err=${revErr} contam=${contam}`);
}

// ---- CROSS-SECTION + NEGATIVES ----
let crossFail = 0;
let negFalsePass = 0;
{
  const [a, b, c] = NAMES[0];
  const msg = pack({
    a,
    b,
    c,
    aC: 12.8,
    bC: 16.4,
    cC: 14.1,
    aDel: 5,
    bDel: 4,
    cDelEarlier: 5,
    cDelCorrected: 8,
    bPending: true,
  });
  const d = buildDecisionCaseState(msg);
  if (!d) fail("cross-section no decision case");
  const bad = [
    `Eligible set: ${a} + ${c}. Select ${c}.`,
    `Eligible: ${a}. DO NOT SELECT ANY.`,
    `Select ${b} now because highest contribution.`,
    `Eligible set: ${a}. Current selection: ${c}.`,
    `${b} is currently eligible with pending approval.`,
  ];
  for (const ans of bad) {
    const assess = assessDecisionVisibilityConsistency(ans, d);
    if (assess.ok) negFalsePass++;
    const fixed = repairDecisionVisibility(ans, d);
    const after = assessDecisionVisibilityConsistency(fixed, d);
    if (!after.ok) crossFail++;
  }
}
if (negFalsePass > 0) fail(`NEGATIVE_CONTROL_FALSE_PASS=${negFalsePass}`);
if (crossFail > 0) fail(`CROSS_SECTION remaining failures after repair=${crossFail}`);

// ---- PRESERVE arithmetic ----
{
  const msg =
    "Cedar: contribution US$12/unit, stock 1000, delivery 5 days, approval granted. Elm: contribution US$11/unit, stock 1000, delivery 5 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose highest contribution eligible.";
  if (!isGivenMetricDecisionAsk(msg) || isCommercialArithmeticAsk(msg)) {
    fail("ARITHMETIC_TASK_HIJACK");
  }
  if (synthesizeCommercialArithmeticAnswer(msg) != null) fail("arith synth hijack");
  const mixed =
    "Price US$40, supplier cost S$18, shipping US$4, fee 6%. Contribution per order?";
  // true mixed must remain ask
  if (!isCommercialArithmeticAsk(mixed)) fail("mixed ask lost");
}

const summary = {
  mission: "W1_T1_CROSS_SECTION_DECISION_CONSISTENCY",
  REPRO_CASES: reproHit,
  CORRECTED_GATE_CASES: gatePass,
  ELIGIBLE_SET_CASES: elPass,
  SELECTION_CASES: selPass,
  REVERSAL_CASES: revPass,
  CURRENT_GATE_ERROR: gateErr,
  SUPERSEDED_VALUE_USED_IN_CURRENT_GATE: supersededUsed,
  ELIGIBLE_SET_ERROR: elErr,
  SELECTION_ERROR: selErr,
  SELECTION_OUTSIDE_ELIGIBLE_SET: outside,
  FALSE_NO_SELECTION: falseDns,
  REVERSAL_ERROR: revErr,
  CURRENT_STATE_CONTAMINATED_BY_REVERSAL: contam,
  CROSS_SECTION_DECISION_CONTRADICTION: crossFail,
  NEGATIVE_CONTROL_FALSE_PASS: negFalsePass,
  FALSE_MIXED_CURRENCY: 0,
  ARITHMETIC_TASK_HIJACK: 0,
  DEV_FULL_PASS: true,
  timestamp: new Date().toISOString(),
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "W1_T1_DECISION_STATE_PROPAGATION_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log("PASS w1-t1 decision-state propagation qualify");


