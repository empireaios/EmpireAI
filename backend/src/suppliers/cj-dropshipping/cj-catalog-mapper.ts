import type { SupplierCatalogItemInput } from "../supplier-product-synchronization/models/supplier-catalog-item.js";
import type { SupplierInventory } from "../supplier-product-synchronization/models/supplier-inventory.js";
import type { SupplierPricing } from "../supplier-product-synchronization/models/supplier-pricing.js";
import type { SupplierShippingData } from "../supplier-product-synchronization/models/supplier-shipping-data.js";
import type { CjIntegrationMode } from "./cj-config.js";
import type { CjFreightOption, CjProduct, CjProductVariant } from "./cj-types.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolvePrimaryVariant(product: CjProduct): CjProductVariant {
  if (product.variants?.length) {
    return product.variants[0]!;
  }

  return {
    vid: `${product.pid}-default`,
    sku: product.productSku ?? product.pid,
    sellPrice: product.sellPrice,
    suggestSellPrice: product.suggestSellPrice,
    inventory: 0,
  };
}

function resolveWarehouseRegion(variant: CjProductVariant): string {
  const warehouse = variant.warehouseInventory?.[0];
  return warehouse?.region ?? warehouse?.warehouseCode ?? "US";
}

function resolveInventoryQuantity(variant: CjProductVariant): number {
  if (typeof variant.inventory === "number") {
    return Math.max(0, variant.inventory);
  }

  const warehouseTotal =
    variant.warehouseInventory?.reduce(
      (sum, entry) => sum + (entry.inventory ?? 0),
      0,
    ) ?? 0;

  return Math.max(0, warehouseTotal);
}

function parseDeliveryDays(option: CjFreightOption): { minDays: number; maxDays: number } {
  if (option.minDeliveryDays !== undefined && option.maxDeliveryDays !== undefined) {
    return {
      minDays: option.minDeliveryDays,
      maxDays: option.maxDeliveryDays,
    };
  }

  const aging = option.logisticAging ?? "";
  const matches = aging.match(/(\d+)\s*[-~to]+\s*(\d+)/i);
  if (matches) {
    return {
      minDays: Number(matches[1]),
      maxDays: Number(matches[2]),
    };
  }

  const single = aging.match(/(\d+)/);
  if (single) {
    const days = Number(single[1]);
    return { minDays: days, maxDays: days + 2 };
  }

  return { minDays: 7, maxDays: 15 };
}

/** Maps a CJ product into M067 SupplierCatalogItemInput. */
export function mapCjProductToCatalogItem(product: CjProduct): SupplierCatalogItemInput {
  const variant = resolvePrimaryVariant(product);
  const unitPrice = variant.sellPrice ?? product.sellPrice ?? 0;
  const compareAtPrice = variant.suggestSellPrice ?? product.suggestSellPrice ?? undefined;

  return {
    supplierSku: variant.sku,
    title: product.productNameEn ?? product.productName,
    description: product.description ?? product.remark,
    category: product.categoryName ?? product.categoryId,
    tags: product.tags ?? [],
    inventoryQuantity: resolveInventoryQuantity(variant),
    warehouseRegion: resolveWarehouseRegion(variant),
    unitPrice,
    currency: "USD",
    compareAtPrice,
  };
}

/** Maps CJ inventory data into M067 SupplierInventory. */
export function mapCjProductToInventory(
  product: CjProduct,
  syncMode: CjIntegrationMode,
): SupplierInventory {
  const variant = resolvePrimaryVariant(product);
  const quantity = resolveInventoryQuantity(variant);

  return {
    supplierSku: variant.sku,
    quantity,
    warehouseRegion: resolveWarehouseRegion(variant),
    inStock: quantity > 0,
    syncMode,
    lastUpdatedAt: new Date().toISOString(),
  };
}

/** Maps CJ pricing data into M067 SupplierPricing. */
export function mapCjProductToPricing(product: CjProduct): SupplierPricing {
  const variant = resolvePrimaryVariant(product);
  const unitPrice = variant.sellPrice ?? product.sellPrice ?? 0;
  const compareAtPrice = variant.suggestSellPrice ?? product.suggestSellPrice ?? null;
  const marginHintPercent =
    compareAtPrice && compareAtPrice > unitPrice
      ? clampScore(((compareAtPrice - unitPrice) / compareAtPrice) * 100)
      : 35;

  return {
    supplierSku: variant.sku,
    unitPrice,
    currency: "USD",
    compareAtPrice,
    marginHintPercent,
  };
}

/** Maps CJ freight options into M067 SupplierShippingData. */
export function mapCjFreightToShippingData(
  product: CjProduct,
  freightOptions: CjFreightOption[],
  destinationCountryCode = "US",
): SupplierShippingData {
  const variant = resolvePrimaryVariant(product);

  const methods =
    freightOptions.length > 0
      ? freightOptions.map((option) => {
          const days = parseDeliveryDays(option);
          return {
            method: option.logisticName ?? "standard",
            cost: option.logisticPrice ?? option.logisticPriceCn ?? 0,
            minDays: days.minDays,
            maxDays: days.maxDays,
            regions: [option.countryCode ?? destinationCountryCode],
          };
        })
      : [
          {
            method: "standard",
            cost: 4.99,
            minDays: 7,
            maxDays: 15,
            regions: [destinationCountryCode],
          },
          {
            method: "express",
            cost: 12.99,
            minDays: 3,
            maxDays: 7,
            regions: [destinationCountryCode],
          },
        ];

  return {
    supplierSku: variant.sku,
    defaultMethod: methods[0]!.method,
    methods,
  };
}

/** Maps CJ products into M067 catalog items. */
export function mapCjProductsToCatalogItems(products: CjProduct[]): SupplierCatalogItemInput[] {
  return products.map((product) => mapCjProductToCatalogItem(product));
}
