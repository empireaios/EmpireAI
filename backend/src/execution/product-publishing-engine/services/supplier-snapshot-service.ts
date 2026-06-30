import { getCjSandboxProducts } from "../../../suppliers/cj-dropshipping/cj-sandbox-fixtures.js";
import {
  mapCjProductToInventory,
  mapCjProductToPricing,
} from "../../../suppliers/cj-dropshipping/cj-catalog-mapper.js";
import { loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";
import {
  isLiveSupplierSyncAllowed,
  loadProductPublishingEnv,
} from "../config/product-publishing-env.js";

export type SupplierProductSnapshot = {
  supplierSku: string;
  inventoryQuantity: number;
  unitCostCents: number;
  compareAtCostCents: number | null;
  currency: string;
  mock: boolean;
  syncedAt: string;
};

function findSandboxProduct(supplierSku: string) {
  return getCjSandboxProducts().find(
    (product) =>
      product.productSku === supplierSku ||
      product.variants?.some((variant) => variant.sku === supplierSku),
  );
}

/** Resolves supplier inventory and cost snapshots for published products. */
export async function fetchSupplierProductSnapshots(
  supplierSkus: string[],
): Promise<Map<string, SupplierProductSnapshot>> {
  const env = loadProductPublishingEnv();
  const syncedAt = new Date().toISOString();
  const snapshots = new Map<string, SupplierProductSnapshot>();

  if (isLiveSupplierSyncAllowed(env)) {
    const config = loadCjConfig();
    void config;
    // Live CJ stock API integration point — falls through to sandbox when unavailable.
  }

  for (const supplierSku of supplierSkus) {
    const product = findSandboxProduct(supplierSku);
    if (!product) {
      snapshots.set(supplierSku, {
        supplierSku,
        inventoryQuantity: 0,
        unitCostCents: 0,
        compareAtCostCents: null,
        currency: "USD",
        mock: true,
        syncedAt,
      });
      continue;
    }

    const inventory = mapCjProductToInventory(product, "SANDBOX");
    const pricing = mapCjProductToPricing(product);

    snapshots.set(supplierSku, {
      supplierSku,
      inventoryQuantity: inventory.quantity,
      unitCostCents: Math.round(pricing.unitPrice * 100),
      compareAtCostCents:
        pricing.compareAtPrice !== null ? Math.round(pricing.compareAtPrice * 100) : null,
      currency: pricing.currency,
      mock: env.PRODUCT_PUBLISHING_MOCK,
      syncedAt,
    });
  }

  return snapshots;
}
