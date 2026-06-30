import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierOpportunity } from "../models/supplier-opportunity.js";
import { registerProductCandidate } from "../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { getGkrRepository } from "../../grand-king-revenue-pipeline/repositories/sqlite-gkr-repository.js";

/** SUP-010 — Push approved supplier products into Grand King Revenue Pipeline. */
export function pushSupplierProductToGkr(
  workspaceId: string,
  companyId: string,
  product: SupplierProduct,
): { productId: string; state: string; skipped?: boolean } {
  const existing = getGkrRepository()
    .listProducts(workspaceId, companyId)
    .find((p) => p.supplierProductId === product.supplierProductId);
  if (existing) {
    return { productId: existing.productId, state: existing.state, skipped: true };
  }

  const registered = registerProductCandidate(workspaceId, companyId, {
    title: product.title,
    category: product.category,
    supplierPlatform: product.providerId,
    supplierProductId: product.supplierProductId,
  });
  return { productId: registered.productId, state: registered.state };
}

export function syncApprovedOpportunitiesToGkr(
  workspaceId: string,
  companyId: string,
  opportunities: SupplierOpportunity[],
  products: SupplierProduct[],
  minScore = 70,
): number {
  let synced = 0;
  for (const opp of opportunities.filter((o) => o.score.overallScore >= minScore)) {
    const product = products.find((p) => p.supplierProductId === opp.supplierProductId);
    if (!product) continue;
    pushSupplierProductToGkr(workspaceId, companyId, product);
    synced += 1;
  }
  return synced;
}
