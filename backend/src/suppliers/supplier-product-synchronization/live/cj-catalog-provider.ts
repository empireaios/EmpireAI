import {
  loadCjConfig,
  syncCjCatalogItems,
  syncCjSupplierCatalogBundle,
  type CjCatalogSyncOptions,
} from "../../cj-dropshipping/index.js";
import type { SupplierPlatform } from "../../supplier-connector-framework/models/supplier-platform.js";
import type { SupplierCatalogItemInput } from "../models/supplier-catalog-item.js";

export type CjCatalogProviderOptions = CjCatalogSyncOptions & {
  platform: SupplierPlatform;
};

/** Resolves CJ Dropshipping catalog items via sandbox fixtures or live API. */
export async function fetchCjCatalogItems(
  options: CjCatalogProviderOptions = { platform: "CJ_DROPSHIPPING" },
): Promise<SupplierCatalogItemInput[]> {
  if (options.platform !== "CJ_DROPSHIPPING") {
    throw new Error(`CJ catalog provider does not support platform ${options.platform}`);
  }

  return syncCjCatalogItems(
    {
      pageNum: options.pageNum,
      pageSize: options.pageSize,
      keyword: options.keyword,
      destinationCountryCode: options.destinationCountryCode,
    },
    loadCjConfig(),
  );
}

/** Resolves full CJ catalog bundle including inventory, pricing, and shipping enrichment. */
export async function fetchCjCatalogBundle(
  options: CjCatalogProviderOptions = { platform: "CJ_DROPSHIPPING" },
) {
  if (options.platform !== "CJ_DROPSHIPPING") {
    throw new Error(`CJ catalog provider does not support platform ${options.platform}`);
  }

  return syncCjSupplierCatalogBundle(
    {
      pageNum: options.pageNum,
      pageSize: options.pageSize,
      keyword: options.keyword,
      destinationCountryCode: options.destinationCountryCode,
    },
    loadCjConfig(),
  );
}

/** Returns true when CJ live/sandbox catalog resolution should be used. */
export function shouldUseCjLiveCatalog(platform: SupplierPlatform): boolean {
  return platform === "CJ_DROPSHIPPING";
}
