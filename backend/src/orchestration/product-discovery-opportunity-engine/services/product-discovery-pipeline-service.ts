import { productScoutEngine } from "../../../intelligence/product-scout/product-scout-engine.js";
import { SCOUT_MOCK_PRODUCTS } from "../../../intelligence/product-scout/mock-products.js";
import type { ProductDiscoveryInput, ProductOpportunity } from "../models/product-opportunity.js";
import { normalizeProductDiscoveryInput } from "../models/product-opportunity.js";
import { opportunitiesFromRecommendations } from "./opportunity-enrichment-service.js";

/** Unified product opportunity discovery pipeline — no publishing. */
export function discoverProductOpportunities(input: ProductDiscoveryInput): ProductOpportunity[] {
  const normalized = normalizeProductDiscoveryInput(input);
  const categoryNormalized = normalized.category.toLowerCase();
  const catalog = SCOUT_MOCK_PRODUCTS.filter(
    (product) =>
      product.category.toLowerCase() === categoryNormalized ||
      categoryNormalized === "all" ||
      categoryNormalized === "general",
  );

  const supplierNetwork = normalized.existingSupplierNetwork.length > 0
    ? normalized.existingSupplierNetwork
    : ["cj-dropshipping"];

  const discoveryInput = normalizeProductDiscoveryInput({
    ...normalized,
    existingSupplierNetwork: supplierNetwork,
  });

  const evaluations = (catalog.length > 0 ? catalog : SCOUT_MOCK_PRODUCTS).map((product) =>
    productScoutEngine.evaluate({
      workspaceId: normalized.workspaceId,
      productId: product.productId,
      productName: product.productName,
      signals: product.signals,
    }),
  );

  return opportunitiesFromRecommendations(evaluations, discoveryInput);
}
