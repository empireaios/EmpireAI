import { MIN_EXPECTED_PROFIT_USD, type MoneyEvidence } from "./models.js";

export type EconomicsInput = {
  proposedSellingPriceUsd: number;
  amazonFees: MoneyEvidence;
  supplierCost: MoneyEvidence;
  shipping: MoneyEvidence;
  otherDirectCostUsd?: number;
  minProfitUsd?: number;
};

export type EconomicsResult = {
  expectedProfitUsd: number | null;
  expectedMarginPct: number | null;
  passesGate: boolean;
  blocker: string | null;
  formula: string;
};

export function calculateExpectedContribution(input: EconomicsInput): EconomicsResult {
  const minProfit = input.minProfitUsd ?? MIN_EXPECTED_PROFIT_USD;
  const fee = input.amazonFees.amountUsd;
  const cost = input.supplierCost.amountUsd;
  const ship = input.shipping.amountUsd;
  const other = input.otherDirectCostUsd ?? 0;

  if (input.amazonFees.freshness === "UNAVAILABLE" || fee === null) {
    return {
      expectedProfitUsd: null,
      expectedMarginPct: null,
      passesGate: false,
      blocker: "Amazon fees UNAVAILABLE — cannot certify non-loss economics",
      formula: "price - fees - cost - shipping - other",
    };
  }
  if (input.supplierCost.freshness === "UNAVAILABLE" || cost === null) {
    return {
      expectedProfitUsd: null,
      expectedMarginPct: null,
      passesGate: false,
      blocker: "Supplier cost UNAVAILABLE — static/heuristic cost forbidden",
      formula: "price - fees - cost - shipping - other",
    };
  }
  if (input.shipping.freshness === "UNAVAILABLE" || ship === null) {
    return {
      expectedProfitUsd: null,
      expectedMarginPct: null,
      passesGate: false,
      blocker: "US shipping/freight UNAVAILABLE",
      formula: "price - fees - cost - shipping - other",
    };
  }

  const profit = input.proposedSellingPriceUsd - fee - cost - ship - other;
  const margin =
    input.proposedSellingPriceUsd > 0 ? (profit / input.proposedSellingPriceUsd) * 100 : null;

  if (profit < minProfit) {
    return {
      expectedProfitUsd: Number(profit.toFixed(2)),
      expectedMarginPct: margin === null ? null : Number(margin.toFixed(2)),
      passesGate: false,
      blocker: `Expected profit $${profit.toFixed(2)} below minimum $${minProfit.toFixed(2)}`,
      formula: "price - fees - cost - shipping - other",
    };
  }

  return {
    expectedProfitUsd: Number(profit.toFixed(2)),
    expectedMarginPct: margin === null ? null : Number(margin.toFixed(2)),
    passesGate: true,
    blocker: null,
    formula: "price - fees - cost - shipping - other",
  };
}

/** Propose a selling price that targets min profit after known landed costs; fees refined later. */
export function proposeSellingPrice(input: {
  supplierCostUsd: number;
  shippingUsd: number;
  suggestSellPriceUsd?: number | null;
  feeGuessUsd?: number;
  minProfitUsd?: number;
}): number {
  const minProfit = input.minProfitUsd ?? MIN_EXPECTED_PROFIT_USD;
  const feeGuess = input.feeGuessUsd ?? Math.max(2.5, input.supplierCostUsd * 0.15);
  const floor = input.supplierCostUsd + input.shippingUsd + feeGuess + minProfit;
  const suggested =
    typeof input.suggestSellPriceUsd === "number" && input.suggestSellPriceUsd > 0
      ? input.suggestSellPriceUsd
      : floor * 1.15;
  return Number(Math.max(floor, suggested).toFixed(2));
}
