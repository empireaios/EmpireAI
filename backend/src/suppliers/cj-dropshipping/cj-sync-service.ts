import type { CjConfig } from "./cj-config.js";
import { hasCjCredentials, isCjLiveApiEnabled, loadCjConfig } from "./cj-config.js";
import { CjApiClient, createCjApiClient } from "./cj-api-client.js";
import {
  mapCjFreightToShippingData,
  mapCjProductToInventory,
  mapCjProductToPricing,
  mapCjProductsToCatalogItems,
} from "./cj-catalog-mapper.js";
import { CjApiError } from "./cj-error.js";
import { getCjSandboxProducts } from "./cj-sandbox-fixtures.js";
import type {
  CjCatalogSyncOptions,
  CjCatalogSyncResult,
  CjHealthCheckResult,
  CjProduct,
} from "./cj-types.js";
import type { SupplierCatalogItemInput } from "../supplier-product-synchronization/models/supplier-catalog-item.js";
import type { SupplierInventory } from "../supplier-product-synchronization/models/supplier-inventory.js";
import type { SupplierPricing } from "../supplier-product-synchronization/models/supplier-pricing.js";
import type { SupplierShippingData } from "../supplier-product-synchronization/models/supplier-shipping-data.js";

let lastSuccessfulSync: string | null = null;
let lastFailureReason: string | null = null;

/** Resets CJ health telemetry (for tests). */
export function resetCjHealthTelemetry(): void {
  lastSuccessfulSync = null;
  lastFailureReason = null;
}

function recordSuccess(): void {
  lastSuccessfulSync = new Date().toISOString();
  lastFailureReason = null;
}

function recordFailure(message: string): void {
  lastFailureReason = message;
}

async function fetchLiveProducts(
  client: CjApiClient,
  options: CjCatalogSyncOptions,
): Promise<CjProduct[]> {
  const response = await client.listProducts({
    pageNum: options.pageNum ?? 1,
    pageSize: options.pageSize ?? 20,
    keyword: options.keyword,
  });

  const products = response.data?.list ?? [];
  if (products.length > 0) {
    return products;
  }

  return [];
}

/** 074B — Synchronizes CJ catalog data into M067-compatible catalog items. */
export async function syncCjCatalog(
  options: CjCatalogSyncOptions = {},
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<CjCatalogSyncResult> {
  if (isCjLiveApiEnabled(config)) {
    try {
      const client = createCjApiClient(config, fetchImpl);
      const products = await fetchLiveProducts(client, options);
      recordSuccess();

      return {
        products,
        integrationMode: config.integrationMode,
        source: "live-api",
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof CjApiError ? error.message : "CJ catalog sync failed";
      recordFailure(message);
      throw error;
    }
  }

  const products = getCjSandboxProducts(options.keyword);
  recordSuccess();

  return {
    products,
    integrationMode: "SANDBOX",
    source: "sandbox-fixture",
    syncedAt: new Date().toISOString(),
  };
}

/** Returns M067 SupplierCatalogItemInput[] from CJ catalog sync. */
export async function syncCjCatalogItems(
  options: CjCatalogSyncOptions = {},
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<SupplierCatalogItemInput[]> {
  const result = await syncCjCatalog(options, config, fetchImpl);
  return mapCjProductsToCatalogItems(result.products);
}

/** 074C — Inventory sync for CJ products. */
export async function syncCjInventory(
  products: CjProduct[],
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<SupplierInventory[]> {
  const syncMode = config.integrationMode;

  if (isCjLiveApiEnabled(config)) {
    const client = createCjApiClient(config, fetchImpl);
    const enriched: CjProduct[] = [];

    for (const product of products) {
      try {
        const stock = await client.queryStockByPid(product.pid);
        const stockEntry = stock.data?.[0];
        const variant = product.variants?.[0];

        if (stockEntry && variant) {
          enriched.push({
            ...product,
            variants: [
              {
                ...variant,
                inventory: stockEntry.inventory ?? variant.inventory,
                warehouseInventory:
                  stockEntry.warehouseInventory ?? variant.warehouseInventory,
              },
            ],
          });
        } else {
          enriched.push(product);
        }
      } catch {
        enriched.push(product);
      }
    }

    return enriched.map((product) => mapCjProductToInventory(product, syncMode));
  }

  return products.map((product) => mapCjProductToInventory(product, "SANDBOX"));
}

/** 074D — Pricing sync for CJ products. */
export function syncCjPricing(products: CjProduct[]): SupplierPricing[] {
  return products.map((product) => mapCjProductToPricing(product));
}

/** 074E — Shipping quote sync for CJ products. */
export async function syncCjShippingQuotes(
  products: CjProduct[],
  destinationCountryCode = "US",
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<SupplierShippingData[]> {
  if (isCjLiveApiEnabled(config)) {
    const client = createCjApiClient(config, fetchImpl);
    const quotes: SupplierShippingData[] = [];

    for (const product of products) {
      const variant = product.variants?.[0];
      if (!variant?.vid) {
        quotes.push(mapCjFreightToShippingData(product, [], destinationCountryCode));
        continue;
      }

      try {
        const response = await client.calculateFreight({
          startCountryCode: "CN",
          endCountryCode: destinationCountryCode,
          products: [{ quantity: 1, vid: variant.vid }],
        });
        quotes.push(
          mapCjFreightToShippingData(
            product,
            response.data ?? [],
            destinationCountryCode,
          ),
        );
      } catch {
        quotes.push(mapCjFreightToShippingData(product, [], destinationCountryCode));
      }
    }

    return quotes;
  }

  return products.map((product) =>
    mapCjFreightToShippingData(product, [], destinationCountryCode),
  );
}

/** 074F — Connector health check for CJ Dropshipping. */
export async function checkCjHealth(
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<CjHealthCheckResult> {
  const credentialsConfigured = hasCjCredentials(config);

  if (!credentialsConfigured) {
    return {
      apiReachable: true,
      credentialsConfigured: false,
      integrationMode: "SANDBOX",
      healthState: "READY",
      message: "CJ sandbox mode active — credentials not configured",
      lastSuccessfulSync,
      lastFailureReason,
    };
  }

  if (config.integrationMode !== "LIVE") {
    return {
      apiReachable: true,
      credentialsConfigured: true,
      integrationMode: "SANDBOX",
      healthState: "READY",
      message: "CJ credentials configured — running in SANDBOX mode",
      lastSuccessfulSync,
      lastFailureReason,
    };
  }

  try {
    const client = createCjApiClient(config, fetchImpl);
    const health = await client.healthCheck();
    recordSuccess();

    return {
      apiReachable: health.reachable,
      credentialsConfigured: true,
      integrationMode: "LIVE",
      healthState: health.reachable ? "READY" : "DEGRADED",
      message: health.message,
      lastSuccessfulSync,
      lastFailureReason,
    };
  } catch (error) {
    const message = error instanceof CjApiError ? error.message : "CJ health check failed";
    recordFailure(message);

    return {
      apiReachable: false,
      credentialsConfigured: true,
      integrationMode: "LIVE",
      healthState: "FAILED",
      message,
      lastSuccessfulSync,
      lastFailureReason: message,
    };
  }
}

/** Full CJ sync bundle for M067 integration. */
export async function syncCjSupplierCatalogBundle(
  options: CjCatalogSyncOptions = {},
  config: CjConfig = loadCjConfig(),
  fetchImpl: typeof fetch = fetch,
): Promise<{
  catalogItems: SupplierCatalogItemInput[];
  inventory: SupplierInventory[];
  pricing: SupplierPricing[];
  shipping: SupplierShippingData[];
  products: CjProduct[];
  integrationMode: CjConfig["integrationMode"];
  source: CjCatalogSyncResult["source"];
}> {
  const catalog = await syncCjCatalog(options, config, fetchImpl);
  const destination = options.destinationCountryCode ?? "US";

  const inventory = await syncCjInventory(catalog.products, config, fetchImpl);
  const pricing = syncCjPricing(catalog.products);
  const shipping = await syncCjShippingQuotes(
    catalog.products,
    destination,
    config,
    fetchImpl,
  );

  const catalogItems = mapCjProductsToCatalogItems(catalog.products).map((item, index) => ({
    ...item,
    inventoryQuantity: inventory[index]?.quantity ?? item.inventoryQuantity,
    unitPrice: pricing[index]?.unitPrice ?? item.unitPrice,
    compareAtPrice: pricing[index]?.compareAtPrice ?? item.compareAtPrice,
    shippingMethods: shipping[index]?.methods,
  }));

  return {
    catalogItems,
    inventory,
    pricing,
    shipping,
    products: catalog.products,
    integrationMode: catalog.integrationMode,
    source: catalog.source,
  };
}
