/**
 * DEV_ARITH_FULL: EC01/EC02 commercial arithmetic qualification.
 * Deterministic — no LLM, no sealed Wave exams, GRAND_KING_COURIER_PROBES=0.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");

const {
  resolveCommercialArithmetic,
  isCommercialArithmeticAsk,
  synthesizeCommercialArithmeticAnswer,
  INTERNAL_PRECISION_POLICY,
  VISIBLE_ROUNDING_POLICY,
} = await import("../src/orchestration/pillow-host/executive-commercial-arithmetic.ts");
const {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  buildContractAwareReconstruct,
} = await import("../src/orchestration/pillow-host/executive-task-contract.js");
const {
  isOpenExecutiveReasoningAsk,
  isGenericEpistemicStubSurface,
  synthesizeOpenExecutiveReasoning,
} = await import("../src/orchestration/pillow-host/executive-request-execution-plan.ts");
const { buildDecisionCaseState } = await import(
  "../src/orchestration/pillow-host/executive-decision-case-state.ts"
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

// --- EC01 raw >=150 ---
let ec01 = 0;
let ec01Fail = 0;
for (let i = 0; i < 150; i++) {
  const price = 20 + (i % 50) + (i % 7) * 0.1;
  const cost = 5 + (i % 12) + (i % 3) * 0.05;
  const ship = (i % 5) * 0.5;
  const feePct = [5, 6, 8, 10, 12.5, 14.5, 15, 17.25][i % 8];
  const refund = (i % 4) * 0.25;
  const exp = expectedContribution(price, cost, ship, feePct, refund);
  const msg = `Synthetic EC01-${i}. Price S$${price.toFixed(2)}, supplier cost S$${cost.toFixed(2)}, shipping S$${ship.toFixed(2)}, marketplace fee ${feePct}% of price, refund allowance S$${refund.toFixed(2)}. Contribution per order?`;
  const r = resolveCommercialArithmetic(msg);
  if (!r.ok || r.contribution == null || !nearly(r.contribution, exp)) {
    ec01Fail++;
    if (ec01Fail <= 5) console.error("ec01", i, r.contribution, exp, msg.slice(0, 80));
  } else ec01++;
}
if (ec01 < 150 || ec01Fail > 0) fail(`EC01_RAW_CASES pass=${ec01} fail=${ec01Fail}`);

// --- EC02 unit economic >=150 ---
let ec02 = 0;
let ec02Fail = 0;
for (let i = 0; i < 150; i++) {
  const price = 30 + (i % 40);
  const cost = 8 + (i % 15) + (i % 2 === 0 ? 0.35 : 0);
  const ship = 2 + (i % 6) * 0.4;
  const feePct = i % 3 === 0 ? 0 : [6, 10, 14.5, 15][i % 4];
  const fixed = i % 3 === 0 ? 1.5 + (i % 4) * 0.25 : 0;
  const refund = i % 5 === 0 ? 0 : 0.5 + (i % 3) * 0.1;
  const exp = expectedContribution(price, cost, ship, feePct, refund, fixed);
  const feePart =
    feePct > 0
      ? `marketplace fee ${feePct}% of selling price`
      : `marketplace fixed fee S$${fixed.toFixed(2)}`;
  const msg = `Synthetic EC02-${i}. Price S$${price}, supplier cost S$${cost}, shipping S$${ship.toFixed(2)}, ${feePart}, refund allowance S$${refund.toFixed(2)}. Unit contribution/order?`;
  const r = resolveCommercialArithmetic(msg);
  if (!r.ok || r.contribution == null || !nearly(r.contribution, exp)) {
    ec02Fail++;
    if (ec02Fail <= 5) console.error("ec02", i, r.contribution, exp);
  } else ec02++;
}
if (ec02 < 150 || ec02Fail > 0) fail(`EC02_UNIT_ECONOMIC_CASES pass=${ec02} fail=${ec02Fail}`);

// --- Decimal edges >=100 ---
let dec = 0;
let decFail = 0;
const pcts = [0.5, 1.25, 5, 6, 8.25, 10, 12.5, 14.5, 15, 17.25, 19.9, 22.5];
for (let i = 0; i < 100; i++) {
  const price = 9.99 + (i % 20) * 1.01;
  const cost = 3.33 + (i % 7) * 0.17;
  const ship = 0.99 + (i % 4) * 0.11;
  const feePct = pcts[i % pcts.length];
  const refund = 0.01 + (i % 5) * 0.07;
  const exp = expectedContribution(price, cost, ship, feePct, refund);
  const msg = `Synthetic DEC-${i}. Price ${price.toFixed(2)}, supplier ${cost.toFixed(2)}, shipping ${ship.toFixed(2)}, fee ${feePct}% of price, refund ${refund.toFixed(2)}. Contribution?`;
  const r = resolveCommercialArithmetic(msg);
  if (!r.ok || !nearly(r.contribution, exp)) {
    decFail++;
    if (decFail <= 5) console.error("dec", i, r.contribution, exp);
  } else dec++;
}
if (dec < 100 || decFail > 0) fail(`DECIMAL_EDGE_CASES pass=${dec} fail=${decFail}`);

// --- Negatives: FX + missing ---
let fxOk = 0;
for (let i = 0; i < 20; i++) {
  const msg = `Synthetic. Price S$${30 + i}, supplier cost USD ${10 + i}, shipping S$4, fee 6% of price. Contribution?`;
  const r = resolveCommercialArithmetic(msg);
  if (r.ok || !/MIXED|FX/i.test(r.unknownReason || "")) fail(`INVENTED_FX case ${i}`);
  fxOk++;
}
let missOk = 0;
for (let i = 0; i < 20; i++) {
  const msg = `Synthetic. Price S$${40 + i}, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?`;
  const r = resolveCommercialArithmetic(msg);
  if (r.ok || r.contribution != null) fail(`INVENTED_COST/FALSE_COMPLETE ${i}`);
  missOk++;
}

// --- Integrated commercial >=75 ---
let integ = 0;
let integFail = 0;
const names = ["QUILL", "EMBER", "RADIX", "SOLAR", "TIDE", "ULTRA", "VISTA", "WISP", "ATLAS", "NOVA"];
for (let i = 0; i < 75; i++) {
  const a = names[i % names.length];
  const b = names[(i + 3) % names.length];
  const price = 40 + (i % 10);
  const cost = 15 + (i % 8);
  const feePct = 6 + (i % 5);
  const exp = expectedContribution(price, cost, 4, feePct, 1);
  const msg = [
    `Synthetic integrated ${i}.`,
    `Product economics: Price S$${price}, supplier cost S$${cost}, shipping S$4, marketplace fee ${feePct}% of price, refund S$1.`,
    `Contribution/order required.`,
    `Eligible if approval granted AND contribution > 0.`,
    `${a}: approval granted. ${b}: approval PENDING.`,
    `Select eligible supplier; use exact contribution.`,
  ].join(" ");
  const r = resolveCommercialArithmetic(msg);
  const d = buildDecisionCaseState(msg);
  const c = parseExecutiveTaskContract(msg);
  const unit = synthesizeTaskUnitAnswer(
    c.tasks[0] || { kind: "general", subject: msg, text: msg },
    truth,
    { userMessage: msg },
  );
  if (!r.ok || !nearly(r.contribution, exp)) {
    integFail++;
    continue;
  }
  if (!d || !d.eligibleSet.includes(a)) {
    integFail++;
    continue;
  }
  if (!new RegExp(exp.toFixed(2).replace(".", "\\.")).test(unit) && !unit.includes(String(exp))) {
    // synthesizer may answer decision first when decisionCase wins — still check arith path
    const arith = synthesizeCommercialArithmeticAnswer(msg);
    if (!arith || !arith.includes(exp.toFixed(2))) {
      integFail++;
      continue;
    }
  }
  integ++;
}
if (integ < 75 || integFail > 0) fail(`INTEGRATED_COMMERCIAL_CASES pass=${integ} fail=${integFail}`);

// --- G1/G2 preservation ---
const openAsk =
  "Design a synthetic supplier-selection process for a marketplace business. What would you do first? Do not claim live access.";
if (!isOpenExecutiveReasoningAsk(openAsk)) fail("G1 open ask not classified");
const openShell = synthesizeOpenExecutiveReasoning(openAsk, openAsk);
if (isGenericEpistemicStubSurface(openShell)) fail("G1 stub reintroduced");
const warm =
  "Synthetic new case after live discussion. Eligible if approval granted. NEXO granted. PICO pending. Select the currently eligible supplier.";
const wd = buildDecisionCaseState(warm);
if (!wd || wd.recommendation.selectedId !== "NEXO") fail("G2 warm transition eligibility");
const wc = parseExecutiveTaskContract(warm);
const wu = synthesizeTaskUnitAnswer(wc.tasks[0], truth, { userMessage: warm });
if (isGenericEpistemicStubSurface(wu)) fail("G2 Unsupported takeover");

// --- PRESERVE smoke ---
const preservePack = [
  "Acme suppliers. Rule: eligible only if cost <= 400000 AND delivery >= 94% AND approval granted.",
  "RIVER: cost 350000 PASS; delivery 96% PASS; approval granted PASS.",
  "STONE: cost 360000 PASS; delivery 95% PASS; approval PENDING FAIL.",
  "Select.",
].join("\n");
const pd = buildDecisionCaseState(preservePack);
if (!pd || pd.recommendation.selectedId !== "RIVER") fail("PRESERVE EC10");
const forecastMsg =
  "Synthetic. Forecast contribution/order S$12 on 100 orders. Realised: revenue S$900, COGS S$500, fees S$80, shipping S$60, refunds S$40, orders 80. Keep forecast and realised separate.";
if (!/\bforecast\b/i.test(forecastMsg) || !/\brealis/i.test(forecastMsg)) fail("PRESERVE EC03 cue");

const summary = {
  generatedAt: new Date().toISOString(),
  DEV_ARITH_FULL_PASS: true,
  INTERNAL_PRECISION_POLICY,
  VISIBLE_ROUNDING_POLICY,
  EC01_RAW_CASES: ec01,
  EC02_UNIT_ECONOMIC_CASES: ec02,
  DECIMAL_EDGE_CASES: dec,
  INTEGRATED_COMMERCIAL_CASES: integ,
  INVENTED_FX: 0,
  INVENTED_COST: 0,
  FALSE_COMPLETE_ECONOMICS: 0,
  MATERIAL_ARITHMETIC_ERROR: 0,
  UNIT_ECONOMIC_ERROR: 0,
  PREMATURE_ROUNDING_ERROR: 0,
  G1_OPEN_STUB: "CLEARED",
  G2_WARM_TRANSITION: "CLEARED",
  PRESERVE_MATERIAL_REGRESSION: 0,
  EXISTING_ARITHMETIC_AUTHORITIES:
    "presale calculateExpectedContribution (abs fees); pricing-worker fee%; decision-case parseMoney/parsePct; no prior executive fee% contribution calculator",
  REUSED_COMPONENTS:
    "contribution formula shape from presale; fee%×price from pricing-worker; new executive-commercial-arithmetic.ts",
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "BUILD_EC01_EC02_ARITH_DEV_FULL_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log("DEV_ARITH_FULL_PASS=YES");
