import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierComparisonResult } from "../models/supplier-comparison.js";
import { scoreSupplierProduct } from "./supplier-scoring-service.js";
import { evaluateShippingAcceptability } from "./shipping-acceptability-service.js";
import { getSupplierProvider } from "../models/supplier-abstraction.js";

/** SUP-006 — Compare suppliers for one product idea. */
export function compareSuppliersForProduct(
  productIdea: string,
  targetCountry: string,
  candidates: SupplierProduct[],
): SupplierComparisonResult {
  const scored = candidates.map((product) => {
    const score = scoreSupplierProduct(product);
    const shipping = evaluateShippingAcceptability({
      targetCountry,
      category: product.category,
      shippingDaysMin: product.shippingDaysMin ?? 7,
      shippingDaysMax: product.shippingDaysMax ?? 14,
      pricePoint: product.costPrice,
      suggestedRetailPrice: product.suggestedRetailPrice,
      marginPercent: product.suggestedRetailPrice
        ? ((product.suggestedRetailPrice - product.costPrice) / product.suggestedRetailPrice) * 100
        : undefined,
    });
    const displayName = getSupplierProvider(product.providerId)?.displayName ?? product.supplierName;
    const composite = score.overallScore * 0.7 + shipping.acceptabilityScore * 0.3;
    return { product, score, shipping, displayName, composite };
  });

  scored.sort((a, b) => b.composite - a.composite);

  const entries = scored.map((s, i) => ({
    providerId: s.product.providerId,
    displayName: s.displayName,
    supplierProductId: s.product.supplierProductId,
    title: s.product.title,
    costPrice: s.product.costPrice,
    score: s.score,
    shipping: s.shipping,
    rank: i + 1,
  }));

  const best = entries[0];
  return {
    productIdea,
    targetCountry,
    entries,
    recommendedProviderId: best?.providerId ?? "",
    recommendedSupplierProductId: best?.supplierProductId ?? "",
    rationale: best
      ? `Recommended ${best.displayName} (score ${best.score.overallScore}, shipping ${best.shipping.verdict}) — EmpireAI Intelligence selects best supplier, not CJ by default`
      : "No supplier candidates provided",
    computedAt: new Date().toISOString(),
  };
}
