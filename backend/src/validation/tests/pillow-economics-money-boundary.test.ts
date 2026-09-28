import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateExpectedContribution } from "../../orchestration/pillow-commerce-presale/economics.js";
import type { EconomicsInput } from "../../orchestration/pillow-commerce-presale/economics.js";

const baseline: EconomicsInput = {
  proposedSellingPriceUsd: 20,
  amazonFees: { amountUsd: 2.5, freshness: "LIVE", source: "offline Amazon fixture" },
  supplierCost: { amountUsd: 7, freshness: "LIVE", source: "offline CJ fixture" },
  shipping: { amountUsd: 4, freshness: "LIVE", source: "offline CJ fixture" },
};

test("only bounded exact-cent monetary evidence can pass Pillow contribution gate", () => {
  const good = calculateExpectedContribution(baseline);
  assert.equal(good.passesGate, true);
  assert.equal(good.expectedProfitUsd, 6.5);
  const cases: EconomicsInput[] = [
    { ...baseline, proposedSellingPriceUsd: Infinity },
    { ...baseline, proposedSellingPriceUsd: NaN },
    { ...baseline, proposedSellingPriceUsd: -1 },
    { ...baseline, proposedSellingPriceUsd: 20.001 },
    { ...baseline, amazonFees: { ...baseline.amazonFees, amountUsd: NaN } },
    { ...baseline, amazonFees: { ...baseline.amazonFees, amountUsd: -2 } },
    { ...baseline, supplierCost: { ...baseline.supplierCost, amountUsd: 0.001 } },
    { ...baseline, shipping: { ...baseline.shipping, amountUsd: Infinity } },
    { ...baseline, otherDirectCostUsd: -1 },
    { ...baseline, minProfitUsd: NaN },
    { ...baseline, minProfitUsd: -1 },
    { ...baseline, proposedSellingPriceUsd: Number.MAX_VALUE },
  ];
  for (const item of cases) {
    const result = calculateExpectedContribution(item);
    assert.equal(result.passesGate, false);
    assert.equal(result.expectedProfitUsd, null);
    assert.equal(result.expectedMarginPct, null);
  }
});
