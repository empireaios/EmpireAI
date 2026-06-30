import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierOpportunity } from "../models/supplier-opportunity.js";
import { runCommercialReview } from "../../runtime/commerce-intelligence-studio/services/commercial-review-service.js";
import { getCisRepository } from "../../runtime/commerce-intelligence-studio/repositories/sqlite-cis-repository.js";

function toCisInput(product: SupplierProduct) {
  const margin = product.suggestedRetailPrice
    ? ((product.suggestedRetailPrice - product.costPrice) / product.suggestedRetailPrice) * 100
    : undefined;
  return {
    supplierProductId: product.supplierProductId,
    supplierName: product.supplierName,
    title: product.title,
    description: `Sourced via ${product.providerId} — supplier data is input, not authority`,
    category: product.category,
    costPrice: product.costPrice,
    suggestedRetailPrice: product.suggestedRetailPrice,
    shippingDays: product.shippingDaysMax ?? product.shippingDaysMin,
    marginPercent: margin,
    imageUrls: product.images,
    attributes: product.specs,
    tags: product.tags,
  };
}

/** SUP-009 — Push supplier product into Commerce Intelligence Studio. */
export function pushSupplierProductToCis(
  workspaceId: string,
  companyId: string,
  product: SupplierProduct,
): { queued: boolean; reviewId?: string } {
  const input = toCisInput(product);
  getCisRepository().saveSupplierProduct(workspaceId, companyId, input);
  const review = runCommercialReview(workspaceId, companyId, input);
  return { queued: true, reviewId: review.reviewId };
}

export function syncOpportunitiesToCis(
  workspaceId: string,
  companyId: string,
  opportunities: SupplierOpportunity[],
  products: SupplierProduct[],
): number {
  let synced = 0;
  for (const opp of opportunities.filter((o) => ["CIS_QUEUED", "UNDER_REVIEW"].includes(o.pipelineStatus))) {
    const product = products.find((p) => p.supplierProductId === opp.supplierProductId);
    if (!product) continue;
    pushSupplierProductToCis(workspaceId, companyId, product);
    synced += 1;
  }
  return synced;
}
