/**
 * DEV lock: EC01/EC02 commercial arithmetic precision.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INTERNAL_PRECISION_POLICY,
  VISIBLE_ROUNDING_POLICY,
  computeCommercialContribution,
  formatMoneyVisible,
  isCommercialArithmeticAsk,
  parseCommercialOperands,
  resolveCommercialArithmetic,
  roundMoneyVisible,
  synthesizeCommercialArithmeticAnswer,
  detectArithmeticMismatch,
} from "../../orchestration/pillow-host/executive-commercial-arithmetic.js";
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
    // 39.90 - 12.35 - 4.80 - (39.90*0.145) - 1.20 = 39.90 - 12.35 - 4.80 - 5.7855 - 1.20 = 15.7645 → 15.76
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
    // 100 - 40 - 10 - 10 = 40; margin 40%
    assert.equal(r.contribution, 40);
    assert.equal(r.marginPercent, 40);
  });

  it("negative contribution allowed", () => {
    const r = resolveCommercialArithmetic(
      "Price 20, cost 18, ship 4, fee 10% of price, refund 1. Contribution?",
    );
    // 20 - 18 - 4 - 2 - 1 = -5
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
    assert.match(a!, /20\.00/); // 50-20-5-5=20
  });
});
