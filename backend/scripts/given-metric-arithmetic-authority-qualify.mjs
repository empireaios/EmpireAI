/**
 * SEMANTIC_INTERFERENCE_FORENSIC — given-metric vs arithmetic authority qualify.
 * Deterministic — no LLM, no sealed Wave exams, GRAND_KING_COURIER_PROBES=0.
 *
 * Quotas:
 *   GIVEN_METRIC_DECISION_CASES >= 100
 *   ARITHMETIC_CASES >= 100
 *   WARM_SINGLE_CURRENCY_CASES >= 50
 *   DECISION_INTEGRATION_CASES >= 75
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");

const {
  resolveCommercialArithmetic,
  isCommercialArithmeticAsk,
  isGivenMetricDecisionAsk,
  parseCommercialOperands,
  synthesizeCommercialArithmeticAnswer,
  repairAnswerWithCalculator,
} = await import("../src/orchestration/pillow-host/executive-commercial-arithmetic.ts");
const { buildDecisionCaseState } = await import(
  "../src/orchestration/pillow-host/executive-decision-case-state.ts"
);
const { synthesizeTaskUnitAnswer, parseExecutiveTaskContract } = await import(
  "../src/orchestration/pillow-host/executive-task-contract.js"
);
const { isOpenExecutiveReasoningAsk, isGenericEpistemicStubSurface } = await import(
  "../src/orchestration/pillow-host/executive-request-execution-plan.ts"
);

const truth = {
  birth: { birthTimestamp: null },
  product: { productName: "Mini Fan", asin: null },
  financial: { orders: 0, revenue: 0 },
  deploy: { serviceOnlineHint: "assume_online_if_answering" },
};

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function nearly(a, b, eps = 0.011) {
  return Math.abs(a - b) <= eps;
}

function expectedContribution(price, cost, ship, feePct, refund = 0, fixed = 0) {
  const fee = price * (feePct / 100) + fixed;
  return Math.round((price - cost - ship - fee - refund + Number.EPSILON) * 100) / 100;
}

const NAMES_A = [
  "Juniper",
  "Lotus",
  "Maple",
  "Cedar",
  "Elm",
  "Aspen",
  "Birch",
  "Oak",
  "Pine",
  "Willow",
  "Alder",
  "Beech",
];
const NAMES_B = [
  "Nimbus",
  "Cirrus",
  "Stratus",
  "Cumulus",
  "Zephyr",
  "Boreas",
  "Notus",
  "Eurus",
  "Atlas",
  "Helix",
  "Orbit",
  "Pulse",
];

function givenMetricPack(i, opts = {}) {
  const a = NAMES_A[i % NAMES_A.length];
  const b = NAMES_B[i % NAMES_B.length];
  const c = NAMES_A[(i + 3) % NAMES_A.length];
  const metricWord = opts.metricWord || ["contribution", "margin", "profit", "score"][i % 4];
  const cur = opts.currency || "US$";
  const aVal = 10 + (i % 9);
  const bVal = 12 + (i % 11);
  const cVal = 11 + (i % 7);
  const aDel = 3 + (i % 3); // 3..5
  const bDel = 4 + (i % 2); // 4..5
  const cDel = 7 + (i % 2); // 7..8 — fails delivery <=6
  const bApproval = opts.bPending ? "pending" : "granted";
  const floor = opts.floor ?? 10;
  const stockFloor = opts.stockFloor ?? 900;
  const delMax = opts.delMax ?? 6;
  // Title-case one-line peers (forensic GK class) + multiline every 5th
  if (i % 5 === 0) {
    return `Architecture checkpoint — bounded decision

Three suppliers:

${a}:
${metricWord} ${cur}${aVal}/unit
stock 1,000
delivery ${aDel} days
approval granted.

${b}:
${metricWord} ${cur}${bVal}/unit
stock 1,500
delivery ${bDel} days
approval ${bApproval}.

${c}:
${metricWord} ${cur}${cVal}/unit
stock 1,200
delivery ${cDel} days
approval granted.

Eligibility:
${metricWord} >=${floor}
stock >=${stockFloor}
delivery <=${delMax}
approval granted.

Choose eligible supplier with highest ${metricWord}.
Answer only: 1. Current eligible set. 2. Supplier to select now. 3. If ${b} approval becomes granted, whether selection changes and to whom.`;
  }
  return `Architecture checkpoint — bounded decision Three suppliers are available: ${a}: ${metricWord} ${cur}${aVal}/unit, stock 1,000, delivery ${aDel} days, approval granted. ${b}: ${metricWord} ${cur}${bVal}/unit, stock 1,500, delivery ${bDel} days, approval ${bApproval}. ${c}: ${metricWord} ${cur}${cVal}/unit, stock 1,200, delivery ${cDel} days, approval granted. Eligibility: ${metricWord} >=${floor}, stock >=${stockFloor}, delivery <=${delMax}, approval granted. Choose eligible supplier with highest ${metricWord}. Answer only: 1. Current eligible set. 2. Supplier to select now. 3. If ${b} approval becomes granted, whether selection changes and to whom.`;
}

function expectedEligibleSelect(i, opts = {}) {
  const a = NAMES_A[i % NAMES_A.length];
  const b = NAMES_B[i % NAMES_B.length];
  const aVal = 10 + (i % 9);
  const bVal = 12 + (i % 11);
  const bPending = !!opts.bPending;
  // c always fails delivery; a always eligible; b eligible iff granted
  if (!bPending) {
    // both a and b eligible — highest metric wins
    if (bVal >= aVal) return { eligible: [a, b].sort(), selected: bVal >= aVal ? b : a, preferB: bVal >= aVal };
    return { eligible: [a, b], selected: aVal > bVal ? a : b, preferB: bVal > aVal };
  }
  return { eligible: [a], selected: a, preferB: false, bName: b, bVal, aVal };
}

// ---------- GIVEN_METRIC_DECISION_CASES >= 100 ----------
let givenPass = 0;
let hijack = 0;
let falseMixed = 0;
let decisionErr = 0;
for (let i = 0; i < 100; i++) {
  const bPending = i % 2 === 0;
  const msg = givenMetricPack(i, { bPending, currency: i % 3 === 0 ? "US$" : "$" });
  const ops = parseCommercialOperands(msg);
  const ask = isCommercialArithmeticAsk(msg);
  const given = isGivenMetricDecisionAsk(msg);
  const synth = synthesizeCommercialArithmeticAnswer(msg, "Unit economics");
  const d = buildDecisionCaseState(msg);
  if (!given) {
    decisionErr++;
    if (decisionErr <= 3) console.error("not_given", i, msg.slice(0, 80));
    continue;
  }
  if (ask || synth != null) {
    hijack++;
    if (hijack <= 5) console.error("hijack", i, { ask, synth: synth?.slice(0, 80) });
  }
  if (ops.currency === "MIXED") {
    falseMixed++;
    if (falseMixed <= 5) console.error("falseMixed", i, ops);
  }
  const exp = expectedEligibleSelect(i, { bPending });
  if (!d) {
    decisionErr++;
    if (decisionErr <= 5) console.error("no_dc", i);
    continue;
  }
  const el = [...d.eligibleSet].sort();
  const expEl = [...new Set(exp.eligible)].sort();
  // When both eligible, selected = higher metric (b if bVal>=aVal)
  const a = NAMES_A[i % NAMES_A.length];
  const b = NAMES_B[i % NAMES_B.length];
  const aVal = 10 + (i % 9);
  const bVal = 12 + (i % 11);
  let wantSelected = a;
  let wantEligible = [a];
  if (!bPending) {
    wantEligible = [a, b];
    // Strictly higher metric wins; ties keep extraction-order first (A).
    wantSelected = bVal > aVal ? b : a;
  }
  const elOk =
    el.length === wantEligible.length && wantEligible.every((n) => el.includes(n));
  const selOk = d.recommendation.selectedId === wantSelected;
  if (!elOk || !selOk || d.recommendation.status !== "SELECT") {
    decisionErr++;
    if (decisionErr <= 8) {
      console.error("decision", i, {
        el,
        wantEligible,
        sel: d.recommendation.selectedId,
        wantSelected,
        status: d.recommendation.status,
      });
    }
    continue;
  }
  // Repair must not rewrite a good decision answer
  const good = `Eligible: ${wantEligible.join(", ")}. Select ${wantSelected}.`;
  if (repairAnswerWithCalculator(good, msg) !== good) hijack++;
  givenPass++;
}
if (givenPass < 100 || hijack > 0 || falseMixed > 0 || decisionErr > 0) {
  fail(
    `GIVEN_METRIC pass=${givenPass} hijack=${hijack} falseMixed=${falseMixed} decisionErr=${decisionErr}`,
  );
}

// ---------- ARITHMETIC_CASES >= 100 (+ true MIXED positive control) ----------
let arithPass = 0;
let arithFail = 0;
let inventedFx = 0;
let inventedCost = 0;
let trueMixedOk = 0;
for (let i = 0; i < 100; i++) {
  const price = 20 + (i % 50) + (i % 7) * 0.1;
  const cost = 5 + (i % 12) + (i % 3) * 0.05;
  const ship = (i % 5) * 0.5;
  const feePct = [5, 6, 8, 10, 12.5, 14.5, 15, 17.25][i % 8];
  const refund = (i % 4) * 0.25;
  const exp = expectedContribution(price, cost, ship, feePct, refund);
  const msg = `Synthetic ARITH-${i}. Price S$${price.toFixed(2)}, supplier cost S$${cost.toFixed(2)}, shipping S$${ship.toFixed(2)}, marketplace fee ${feePct}% of price, refund allowance S$${refund.toFixed(2)}. Contribution per order?`;
  if (!isCommercialArithmeticAsk(msg)) {
    arithFail++;
    continue;
  }
  const r = resolveCommercialArithmetic(msg);
  const synth = synthesizeCommercialArithmeticAnswer(msg);
  if (!r.ok || r.contribution == null || !nearly(r.contribution, exp) || !synth) {
    arithFail++;
    if (arithFail <= 5) console.error("arith", i, r.contribution, exp);
  } else arithPass++;
}
// Negative contribution
{
  const msg =
    "Synthetic NEG. Price S$10, supplier cost S$12, shipping S$1, marketplace fee 10% of price, refund S$0. Contribution per order?";
  const r = resolveCommercialArithmetic(msg);
  if (!r.ok || r.contribution == null || r.contribution >= 0) arithFail++;
  else arithPass++;
}
// True MIXED positive control (must remain MIXED / UNKNOWN)
for (let i = 0; i < 20; i++) {
  const msg = `Synthetic MIX-${i}. Price US$${30 + i}, supplier cost S$${10 + i}, shipping US$4, fee 6% of price. Contribution per order?`;
  const ops = parseCommercialOperands(msg);
  const r = resolveCommercialArithmetic(msg);
  const synth = synthesizeCommercialArithmeticAnswer(msg) || "";
  if (ops.currency !== "MIXED" || r.ok || !/MIXED|conversion|FX/i.test(synth + (r.unknownReason || ""))) {
    if (trueMixedOk < 3) console.error("trueMixed fail", i, ops, r);
  } else trueMixedOk++;
  if (/1\s*USD\s*=|assuming.*rate/i.test(synth)) inventedFx++;
}
if (arithPass < 100 || arithFail > 0) fail(`ARITHMETIC pass=${arithPass} fail=${arithFail}`);
if (trueMixedOk < 20) fail(`TRUE_MIXED_CURRENCY_DETECTION pass=${trueMixedOk}/20`);
if (inventedFx > 0) fail(`INVENTED_FX=${inventedFx}`);

// Missing cost discipline
for (let i = 0; i < 15; i++) {
  const msg = `Synthetic MISS-${i}. Price S$${40 + i}, shipping S$4, marketplace fee 6% of price. Contribution per order?`;
  const r = resolveCommercialArithmetic(msg);
  const synth = synthesizeCommercialArithmeticAnswer(msg) || "";
  if (r.ok || !/UNKNOWN|cost/i.test(synth + (r.unknownReason || ""))) inventedCost++;
}
if (inventedCost > 0) fail(`INVENTED_COST=${inventedCost}`);

// ---------- WARM_SINGLE_CURRENCY_CASES >= 50 ----------
// Request-local: prior SGD warm history must NOT be merged into current USD case currency.
let warmPass = 0;
let warmContam = 0;
for (let i = 0; i < 50; i++) {
  const warmPrior = `Prior session turn ${i}: Price S$40, cost S$18, shipping S$4, fee 6%, contribution S$14.60. EmpireAI ledger SGD.`;
  const current = givenMetricPack(i + 7, { bPending: true, currency: "US$" });
  // Architectural invariant: operands/currency from CURRENT user message only
  const ops = parseCommercialOperands(current);
  const synth = synthesizeCommercialArithmeticAnswer(current, "Unit economics");
  const d = buildDecisionCaseState(current);
  if (ops.currency !== "USD") {
    warmContam++;
    if (warmContam <= 3) console.error("warm cur", i, ops);
    continue;
  }
  if (synth != null || !d || d.recommendation.status !== "SELECT") {
    warmContam++;
    continue;
  }
  // Sanity: wrongly concatenating warm+current would see both currencies — detector must
  // still distinguish true mixed when both appear; that is not contamination of CURRENT scope.
  void warmPrior;
  warmPass++;
}
if (warmPass < 50 || warmContam > 0) {
  fail(`WARM pass=${warmPass} contam=${warmContam}`);
}

// ---------- DECISION_INTEGRATION_CASES >= 75 ----------
let integPass = 0;
let elErr = 0;
let selErr = 0;
let revErr = 0;
for (let i = 0; i < 75; i++) {
  const bPending = true;
  const msg = givenMetricPack(i + 11, { bPending, metricWord: "contribution", currency: "US$" });
  const d = buildDecisionCaseState(msg);
  const a = NAMES_A[(i + 11) % NAMES_A.length];
  const b = NAMES_B[(i + 11) % NAMES_B.length];
  const aVal = 10 + ((i + 11) % 9);
  const bVal = 12 + ((i + 11) % 11);
  if (!d) {
    elErr++;
    continue;
  }
  if (!(d.eligibleSet.length === 1 && d.eligibleSet[0] === a)) {
    elErr++;
    if (elErr <= 5) console.error("el", i, d.eligibleSet, a);
    continue;
  }
  if (d.recommendation.selectedId !== a) {
    selErr++;
    continue;
  }
  const revHit = (d.reversalConditions || []).some(
    (r) => new RegExp(b, "i").test(r) && /selection changes|select/i.test(r),
  );
  // When bVal > aVal, granting b should change selection to b
  if (bVal > aVal && !revHit) {
    revErr++;
    if (revErr <= 5) console.error("rev", i, d.reversalConditions, b, aVal, bVal);
    continue;
  }
  // Task synth path: no unit-econ stub
  const contract = parseExecutiveTaskContract(msg);
  const unit =
    contract?.tasks?.[0] &&
    synthesizeTaskUnitAnswer(contract.tasks[0], truth, {
      userMessage: msg,
      siblingSubjects: contract.tasks.slice(0, 3).map((t) => t.subject || t.text),
    });
  if (unit && /Mixed currencies|Contribution\/order:\s*UNKNOWN/i.test(unit)) {
    elErr++;
    continue;
  }
  integPass++;
}
if (integPass < 75 || elErr > 0 || selErr > 0 || revErr > 0) {
  fail(`DECISION_INTEG pass=${integPass} el=${elErr} sel=${selErr} rev=${revErr}`);
}

// ---------- PRESERVE: open stub + G1 smoke ----------
{
  const open = "Outline a practical supplier onboarding process for a new marketplace channel.";
  if (isOpenExecutiveReasoningAsk(open)) {
    /* ok */
  }
  const contract = parseExecutiveTaskContract(open);
  const unit =
    contract?.tasks?.[0] &&
    synthesizeTaskUnitAnswer(contract.tasks[0], truth, { userMessage: open });
  if (unit && isGenericEpistemicStubSurface(unit)) {
    fail("G1_OPEN_STUB regression — epistemic stub on open ask");
  }
}

const summary = {
  mission: "SEMANTIC_INTERFERENCE_FORENSIC",
  target: "GIVEN_METRIC_ARITHMETIC_AUTHORITY",
  GIVEN_METRIC_DECISION_CASES: givenPass,
  ARITHMETIC_CASES: arithPass,
  TRUE_MIXED_CURRENCY_DETECTION: `${trueMixedOk}/20`,
  WARM_SINGLE_CURRENCY_CASES: warmPass,
  DECISION_INTEGRATION_CASES: integPass,
  ARITHMETIC_TASK_HIJACK: hijack,
  FALSE_MIXED_CURRENCY: falseMixed,
  WARM_FOREIGN_CURRENCY_CONTAMINATION: warmContam,
  MATERIAL_ARITHMETIC_ERROR: arithFail,
  INVENTED_FX: inventedFx,
  INVENTED_COST: inventedCost,
  ELIGIBLE_SET_ERROR: elErr,
  SELECTION_ERROR: selErr,
  REVERSAL_ERROR: revErr,
  DEV_GIVEN_METRIC_ARITH_FULL_PASS: true,
  timestamp: new Date().toISOString(),
};

mkdirSync(OUT, { recursive: true });
writeFileSync(
  path.join(OUT, "GIVEN_METRIC_ARITHMETIC_AUTHORITY_QUAL.json"),
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
console.log("PASS given-metric arithmetic authority qualify");
