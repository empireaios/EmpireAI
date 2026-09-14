import { moneyRound } from "./ledger.js";
import type { MoneyCurrency, SyntheticProduct, UnitEconomics } from "./types.js";

export type UnitEconomicsInput = {
  productId: string;
  variantId?: string;
  landedCost: number;
  sellingPrice: number;
  fees: number;
  shipping: number;
  ads: number;
  expectedRefundEffect: number;
  realisedRefundEffect?: number;
  currency: MoneyCurrency;
};

/**
 * Unit economics rails — all figures synthetic by construction.
 * contributionBeforeAds = sellingPrice − landed − fees − shipping
 * contributionAfterAds  = before − ads
 * realisedContribution  = after − realisedRefundEffect (defaults to expected)
 */
export function computeUnitEconomics(input: UnitEconomicsInput): UnitEconomics {
  const landedCost = moneyRound(input.landedCost);
  const contributionBeforeAds = moneyRound(
    input.sellingPrice - landedCost - input.fees - input.shipping,
  );
  const contributionAfterAds = moneyRound(contributionBeforeAds - input.ads);
  const expectedRefundEffect = moneyRound(input.expectedRefundEffect);
  const realisedRefund =
    input.realisedRefundEffect === undefined
      ? expectedRefundEffect
      : moneyRound(input.realisedRefundEffect);
  const realisedContribution = moneyRound(contributionAfterAds - realisedRefund);

  return {
    productId: input.productId,
    variantId: input.variantId,
    landedCost,
    contributionBeforeAds,
    contributionAfterAds,
    expectedRefundEffect,
    realisedContribution,
    currency: input.currency,
    source: "synthetic",
  };
}

export function unitEconomicsFromProduct(
  product: SyntheticProduct,
  variantId?: string,
): UnitEconomics {
  const variant =
    product.variants.find((v) => v.variantId === variantId) ?? product.variants[0];
  if (!variant) {
    throw new Error(`Product ${product.productId} has no variants`);
  }
  const fees = moneyRound(product.amazonReferralFeeUsd + product.fbaOrSellerFeeUsd);
  const expectedRefundEffect = moneyRound(
    product.listPriceUsd * product.expectedRefundRate,
  );
  return computeUnitEconomics({
    productId: product.productId,
    variantId: variant.variantId,
    landedCost: variant.unitProductCostUsd,
    sellingPrice: product.listPriceUsd,
    fees,
    shipping: product.shippingEstimateUsd,
    ads: product.adsSpendPerUnitUsd,
    expectedRefundEffect,
    currency: "USD",
  });
}
