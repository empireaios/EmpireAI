import type { ShippingAcceptabilityInput, ShippingAcceptabilityResult } from "../models/shipping-acceptability.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** SUP-005 — Shipping acceptability (shipping time alone never rejects). */
export function evaluateShippingAcceptability(input: ShippingAcceptabilityInput): ShippingAcceptabilityResult {
  const avgDays = Math.round((input.shippingDaysMin + input.shippingDaysMax) / 2);
  const marketplaceNorm = input.marketplaceNormDays ?? 12;
  const competitorExpect = input.competitorExpectationDays ?? 10;
  const margin = input.marginPercent ?? (
    input.suggestedRetailPrice && input.pricePoint > 0
      ? ((input.suggestedRetailPrice - input.pricePoint) / input.suggestedRetailPrice) * 100
      : 30
  );

  const factors: ShippingAcceptabilityResult["factors"] = [];
  let score = 70;

  if (avgDays <= competitorExpect) {
    score += 15;
    factors.push({ factor: "shipping_vs_competitor", impact: "POSITIVE", note: `${avgDays}d meets competitor expectation (${competitorExpect}d)` });
  } else if (avgDays <= marketplaceNorm) {
    score += 5;
    factors.push({ factor: "shipping_vs_marketplace", impact: "NEUTRAL", note: `${avgDays}d within marketplace norm (${marketplaceNorm}d)` });
  } else {
    score -= 10;
    factors.push({ factor: "shipping_slow", impact: "NEGATIVE", note: `${avgDays}d exceeds marketplace norm — review required, not auto-reject` });
  }

  if (margin >= 40) {
    score += 10;
    factors.push({ factor: "margin_opportunity", impact: "POSITIVE", note: `${Math.round(margin)}% margin offsets longer shipping` });
  } else if (margin < 20) {
    score -= 8;
    factors.push({ factor: "low_margin", impact: "NEGATIVE", note: "Low margin with slow shipping increases risk" });
  }

  if (input.pricePoint >= 50 && avgDays > 14) {
    score += 5;
    factors.push({ factor: "premium_price_tolerance", impact: "POSITIVE", note: "Higher price point tolerates longer delivery" });
  }

  if (input.category.toLowerCase().includes("kitchen") || input.category.toLowerCase().includes("home")) {
    factors.push({ factor: "category_expectation", impact: "NEUTRAL", note: "Home/kitchen category accepts moderate shipping windows" });
  }

  score = clamp(score);
  let verdict: ShippingAcceptabilityResult["verdict"] = "ACCEPTABLE";
  if (score >= 80) verdict = "EXCELLENT";
  else if (score >= 60) verdict = "ACCEPTABLE";
  else if (score >= 45) verdict = "MARGINAL";
  else verdict = "REVIEW_REQUIRED";

  return {
    acceptable: verdict !== "REVIEW_REQUIRED" || margin >= 35,
    acceptabilityScore: score,
    verdict,
    factors,
    shippingTimeAloneWouldReject: false,
    computedAt: new Date().toISOString(),
  };
}
