/**
 * Actual vs expected transaction economics.
 * Never report expected profit as realised profit.
 */
export type TransactionEconomicsRecord = {
  recordId: string;
  amazonOrderId: string;
  amazonSellerSku: string;
  asin: string;
  computedAt: string;
  expected: {
    sellingPriceUsd: number | null;
    profitUsd: number | null;
    marginPct: number | null;
  };
  actual: {
    customerRevenueUsd: number | null;
    amazonFeesUsd: number | null;
    cjProductCostUsd: number | null;
    cjShippingUsd: number | null;
    brandPackagingCostUsd: number | null;
    otherDirectCostsUsd: number | null;
    realisedContributionUsd: number | null;
    freshness: "LIVE" | "PARTIAL" | "UNAVAILABLE";
  };
  marketplacePayoutReceived: "YES" | "NO" | "UNKNOWN";
  orderRevenueRecognized: "YES" | "NO" | "UNKNOWN";
  note: string;
};

export function computeActualContribution(input: {
  customerRevenueUsd: number | null;
  amazonFeesUsd: number | null;
  cjProductCostUsd: number | null;
  cjShippingUsd: number | null;
  brandPackagingCostUsd?: number | null;
  otherDirectCostsUsd?: number | null;
}): { realisedContributionUsd: number | null; freshness: "LIVE" | "PARTIAL" | "UNAVAILABLE" } {
  const parts = [
    input.customerRevenueUsd,
    input.amazonFeesUsd,
    input.cjProductCostUsd,
    input.cjShippingUsd,
  ];
  if (parts.some((p) => p === null || p === undefined)) {
    return { realisedContributionUsd: null, freshness: "UNAVAILABLE" };
  }
  const brand = input.brandPackagingCostUsd ?? 0;
  const other = input.otherDirectCostsUsd ?? 0;
  const realised =
    (input.customerRevenueUsd as number) -
    (input.amazonFeesUsd as number) -
    (input.cjProductCostUsd as number) -
    (input.cjShippingUsd as number) -
    brand -
    other;
  const partial = input.brandPackagingCostUsd == null && input.otherDirectCostsUsd == null;
  return {
    realisedContributionUsd: Number(realised.toFixed(2)),
    freshness: partial ? "PARTIAL" : "LIVE",
  };
}

export function buildTransactionEconomicsRecord(input: {
  recordId: string;
  amazonOrderId: string;
  amazonSellerSku: string;
  asin: string;
  expectedSellingPriceUsd?: number | null;
  expectedProfitUsd?: number | null;
  expectedMarginPct?: number | null;
  customerRevenueUsd: number | null;
  amazonFeesUsd: number | null;
  cjProductCostUsd: number | null;
  cjShippingUsd: number | null;
  brandPackagingCostUsd?: number | null;
  otherDirectCostsUsd?: number | null;
  marketplacePayoutReceived?: "YES" | "NO" | "UNKNOWN";
  orderRevenueRecognized?: "YES" | "NO" | "UNKNOWN";
}): TransactionEconomicsRecord {
  const actual = computeActualContribution(input);
  return {
    recordId: input.recordId,
    amazonOrderId: input.amazonOrderId,
    amazonSellerSku: input.amazonSellerSku,
    asin: input.asin,
    computedAt: new Date().toISOString(),
    expected: {
      sellingPriceUsd: input.expectedSellingPriceUsd ?? null,
      profitUsd: input.expectedProfitUsd ?? null,
      marginPct: input.expectedMarginPct ?? null,
    },
    actual: {
      customerRevenueUsd: input.customerRevenueUsd,
      amazonFeesUsd: input.amazonFeesUsd,
      cjProductCostUsd: input.cjProductCostUsd,
      cjShippingUsd: input.cjShippingUsd,
      brandPackagingCostUsd: input.brandPackagingCostUsd ?? null,
      otherDirectCostsUsd: input.otherDirectCostsUsd ?? null,
      realisedContributionUsd: actual.realisedContributionUsd,
      freshness: actual.freshness,
    },
    marketplacePayoutReceived: input.marketplacePayoutReceived ?? "UNKNOWN",
    orderRevenueRecognized: input.orderRevenueRecognized ?? "UNKNOWN",
    note: "EXPECTED profit is not ACTUAL profit. Marketplace payout is a separate event from order revenue recognition.",
  };
}
