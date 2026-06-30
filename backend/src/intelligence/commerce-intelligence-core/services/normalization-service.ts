import { randomUUID } from "node:crypto";

import type { CjProduct } from "../../../suppliers/cj-dropshipping/cj-types.js";
import {
  mapCjFreightToShippingData,
  mapCjProductToCatalogItem,
} from "../../../suppliers/cj-dropshipping/cj-catalog-mapper.js";
import type { ProductCandidate } from "../models/commerce-intelligence-core.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Converts CJ supplier product into Pillow-owned normalized candidate — raw CJ data does not escape. */
export function normalizeCjProduct(
  workspaceId: string,
  companyId: string,
  product: CjProduct,
): ProductCandidate {
  const catalog = mapCjProductToCatalogItem(product);
  const shipping = mapCjFreightToShippingData(product, [], "US");
  const primaryMethod = shipping.methods[0];
  const variants = (product.variants ?? []).map((v) => ({
    variantId: v.vid,
    sku: v.sku,
    label: v.variantName ?? v.sku,
    supplierCostUsd: v.sellPrice ?? product.sellPrice ?? 0,
    inventory: v.inventory ?? 0,
    warehouseRegion: v.warehouseInventory?.[0]?.region ?? "US",
  }));

  if (variants.length === 0) {
    variants.push({
      variantId: `${product.pid}-default`,
      sku: product.productSku ?? product.pid,
      label: "Default",
      supplierCostUsd: product.sellPrice ?? 0,
      inventory: 0,
      warehouseRegion: "US",
    });
  }

  const inventoryTotal = variants.reduce((sum, v) => sum + v.inventory, 0);
  const images = [
    ...(product.productImage ? [product.productImage] : []),
    ...(product.productImageSet ?? []),
  ].filter((url, idx, arr) => arr.indexOf(url) === idx);

  const seed = hashSeed(product.pid);
  const reliabilityBase = inventoryTotal > 100 ? 78 : inventoryTotal > 30 ? 68 : 55;
  const supplierReliabilityScore = clampScore(reliabilityBase + (seed % 12));

  return {
    candidateId: randomUUID(),
    workspaceId,
    companyId,
    supplierId: "cj-dropshipping",
    supplierProductId: product.pid,
    title: catalog.title,
    category: catalog.category ?? "General",
    supplierCostUsd: catalog.unitPrice,
    variants,
    inventoryTotal,
    shippingCountries: shipping.methods.flatMap((m) => m.regions ?? ["US"]),
    estimatedDeliveryDays: {
      min: primaryMethod?.minDays ?? 7,
      max: primaryMethod?.maxDays ?? 18,
    },
    images,
    mediaUrls: images,
    supplierReliabilityScore,
    fulfilmentReadiness: inventoryTotal > 0 && (primaryMethod?.maxDays ?? 18) <= 21,
    normalizedAt: new Date().toISOString(),
  };
}
