/**
 * DEV lock: EC01/EC02 commercial arithmetic precision + given-metric authority.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERNAL_PRECISION_POLICY,
  VISIBLE_ROUNDING_POLICY,
  computeCommercialContribution,
  formatMoneyVisible,
  isCommercialArithmeticAsk,
  isGivenMetricDecisionAsk,
  parseCommercialOperands,
  resolveCommercialArithmetic,
  roundMoneyVisible,
  synthesizeCommercialArithmeticAnswer,
  detectArithmeticMismatch,
  repairAnswerWithCalculator,
} from "../../orchestration/pillow-host/executive-commercial-arithmetic.js";
import { buildDecisionCaseState } from "../../orchestration/pillow-host/executive-decision-case-state.js";
import {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
} from "../../orchestration/pillow-host/executive-task-contract.js";

function truth() {
  return {
    birth: { birthTimestamp: null as string | null },
    product: { productName: "Mini Fan", asin: null as string | null },
    financial: { orders: 0, revenue: 0 },
    deploy: { serviceOnlineHint: "assume_online_if_answering" as const },
  };
}

const JUNIPER_GK =
  "Architecture checkpoint — bounded decision Three suppliers are available: Juniper: contribution US$13/unit, stock 1,000, delivery 5 days, approval granted. Lotus: contribution US$17/unit, stock 1,500, delivery 4 days, approval granted. Maple: contribution US$15/unit, stock 1,200, delivery 7 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose eligible supplier with highest contribution. Answer only: 1. Current eligible set. 2. Supplier to select now. 3. If Lotus approval becomes granted, whether selection changes and to whom.";

// Note: forensic original has Lotus approval pending — use that for decision tests.
const JUNIPER_FORENSIC =
  "Architecture checkpoint — bounded decision Three suppliers are available: Juniper: contribution US$13/unit, stock 1,000, delivery 5 days, approval granted. Lotus: contribution US$17/unit, stock 1,500, delivery 4 days, approval pending. Maple: contribution US$15/unit, stock 1,200, delivery 7 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose eligible supplier with highest contribution. Answer only: 1. Current eligible set. 2. Supplier to select now. 3. If Lotus approval becomes granted, whether selection changes and to whom.";

describe("EC01/EC02 commercial arithmetic", () => {
  it("documents precision policies", () => {
    assert.ok(INTERNAL_PRECISION_POLICY.length > 20);
    assert.ok(VISIBLE_ROUNDING_POLICY.includes("2 decimal"));
  });

  it("EC01 classic: 40-18-4-6%-1 = 14.60 not 15", () => {
    const msg =
      "Synthetic. Price S$40, supplier cost S$18, shipping S$4, marketplace fee 6% of price, refund allowance S$1. Contribution per order?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.ok, true);
    assert.equal(r.contribution, 14.6);
    assert.equal(r.displayContribution, "S$14.60");
    assert.equal(r.marketplacePercentFeeAmount, 2.4);
  });

  it("EC02 cost shock: cost 20 → 12.60", () => {
    const msg =
      "Synthetic. Price S$40, supplier cost S$20, shipping S$4, marketplace fee 6% of price, refund allowance S$1. Contribution per order?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.contribution, 12.6);
    assert.equal(r.displayContribution, "S$12.60");
  });

  it("14.5% fee on 39.90 with decimals", () => {
    const msg =
      "Synthetic. Price 39.90, supplier 12.35, shipping 4.80, marketplace fee 14.5% of selling price, refund allowance 1.20. Contribution?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.ok, true);
    assert.equal(r.contribution, 15.76);
  });

  it("mixed currency without FX → UNKNOWN", () => {
    const msg =
      "Synthetic. Price S$40, supplier cost USD 18, shipping S$4, fee 6% of price. Contribution?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.ok, false);
    assert.match(r.unknownReason || "", /MIXED|FX/i);
  });

  it("US$ amounts alone are USD not MIXED (no S$ false positive inside US$)", () => {
    const msg =
      "Synthetic. Price US$40, supplier cost US$18, shipping US$4, fee 6% of price. Contribution?";
    const ops = parseCommercialOperands(msg);
    assert.equal(ops.currency, "USD");
    assert.deepEqual(ops.currenciesSeen, ["USD"]);
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.ok, true);
    assert.equal(r.currency, "USD");
  });

  it("fee mentioned without value → UNKNOWN", () => {
    const msg =
      "Synthetic. Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(r.ok, false);
    assert.match(r.unknownReason || "", /UNKNOWN|fee/i);
  });

  it("synthesizeTaskUnitAnswer uses calculator not whole-number approx", () => {
    const msg =
      "Synthetic probe. Price S$40, supplier cost S$18, shipping S$4, marketplace fee 6% of price, refund allowance S$1. What is contribution per order?";
    const c = parseExecutiveTaskContract(msg);
    const out = synthesizeTaskUnitAnswer(c.tasks[0]!, truth() as never, {
      userMessage: msg,
    });
    assert.match(out, /14\.60/);
    assert.doesNotMatch(out, /contribution[^\n]{0,20}\bS?\$?15\b/i);
  });

  it("detects mismatch 15 vs 14.60", () => {
    const msg =
      "Price S$40, cost S$18, shipping S$4, fee 6% of price, refund S$1. Contribution?";
    const r = resolveCommercialArithmetic(msg);
    assert.equal(
      detectArithmeticMismatch("The contribution per order is S$15.", r),
      true,
    );
    assert.equal(
      detectArithmeticMismatch("The contribution per order is S$14.60.", r),
      false,
    );
  });

  it("margin percent separate from dollar contribution", () => {
    const ops = parseCommercialOperands(
      "Price 100, cost 40, ship 10, fee 10% of price. Contribution and margin?",
    );
    ops.askMargin = true;
    const r = computeCommercialContribution(ops);
    assert.equal(r.contribution, 40);
    assert.equal(r.marginPercent, 40);
  });

  it("negative contribution allowed", () => {
    const r = resolveCommercialArithmetic(
      "Price 20, cost 18, ship 4, fee 10% of price, refund 1. Contribution?",
    );
    assert.equal(r.contribution, -5);
  });

  it("isCommercialArithmeticAsk true for unit economics", () => {
    assert.equal(
      isCommercialArithmeticAsk("What is contribution per order? Price 40 cost 18"),
      true,
    );
  });

  it("formatMoneyVisible SGD", () => {
    assert.equal(formatMoneyVisible(14.6, "SGD"), "S$14.60");
    assert.equal(roundMoneyVisible(14.605), 14.61);
  });

  it("synthesizeCommercialArithmeticAnswer returns exact", () => {
    const a = synthesizeCommercialArithmeticAnswer(
      "Synthetic. Price S$50, cost S$20, ship S$5, fee 10% of price. Contribution/order?",
    );
    assert.ok(a);
    assert.match(a!, /20\.00/);
  });

  it("repair overrides invented FX on MIXED currency", () => {
    const msg =
      "Synthetic. Price S$40, supplier cost USD 18, shipping S$4, fee 6% of price. Contribution?";
    const bad =
      "Assuming an exchange rate of 1 USD = S$1.35, contribution is S$8.10.";
    const fixed = repairAnswerWithCalculator(bad, msg);
    assert.match(fixed, /MIXED|no invented FX|UNKNOWN/i);
    assert.doesNotMatch(fixed, /1\s*USD\s*=\s*S\$1\.35/);
  });

  it("repair overrides false-complete when fee unknown", () => {
    const msg =
      "Synthetic. Price S$40, cost S$18, shipping S$4, marketplace fee unknown. Contribution per order?";
    const bad = "Contribution per order = S$18.00 after subtracting known costs.";
    const fixed = repairAnswerWithCalculator(bad, msg);
    assert.match(fixed, /UNKNOWN/i);
  });
});

describe("Given-metric arithmetic authority (Juniper class)", () => {
  it("GK forensic: not arith ask, USD only, no unit-econ stub, DecisionCase SELECT Juniper", () => {
    assert.equal(isGivenMetricDecisionAsk(JUNIPER_FORENSIC), true);
    assert.equal(isCommercialArithmeticAsk(JUNIPER_FORENSIC), false);
    assert.equal(parseCommercialOperands(JUNIPER_FORENSIC).currency, "USD");
    assert.equal(synthesizeCommercialArithmeticAnswer(JUNIPER_FORENSIC), null);
    const d = buildDecisionCaseState(JUNIPER_FORENSIC)!;
    assert.deepEqual(d.eligibleSet, ["Juniper"]);
    assert.equal(d.recommendation.status, "SELECT");
    assert.equal(d.recommendation.selectedId, "Juniper");
    assert.ok(d.candidates.every((c) => c.displayName !== "Only"));
    assert.ok(
      d.reversalConditions.some((r) =>
        /Lotus.*selection changes to Lotus/i.test(r),
      ),
    );
  });

  it("given contribution decision does not hijack via subject Unit economics", () => {
    const msg =
      "Cedar: contribution US$12/unit, stock 1000, delivery 5 days, approval granted. Elm: contribution US$11/unit, stock 1000, delivery 5 days, approval granted. Eligibility: contribution >=10, stock >=900, delivery <=6, approval granted. Choose highest contribution eligible.";
    assert.equal(isGivenMetricDecisionAsk(msg), true);
    assert.equal(synthesizeCommercialArithmeticAnswer(msg, "Unit economics"), null);
    const d = buildDecisionCaseState(msg)!;
    assert.equal(d.recommendation.selectedId, "Cedar");
  });

  it("repair does not rewrite given-metric decisions", () => {
    const good =
      "Eligible: Juniper. Select Juniper. If Lotus approval granted, select Lotus.";
    assert.equal(repairAnswerWithCalculator(good, JUNIPER_FORENSIC), good);
  });

  // Silence unused const if tree-shaken oddly
  void JUNIPER_GK;
});
