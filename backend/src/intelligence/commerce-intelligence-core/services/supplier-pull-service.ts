import { syncCjCatalog } from "../../../suppliers/cj-dropshipping/cj-sync-service.js";
import type { CjProduct } from "../../../suppliers/cj-dropshipping/cj-types.js";

export type SupplierPullResult = {
  products: CjProduct[];
  source: string;
  integrationMode: string;
  pulledAt: string;
};

/** Pulls supplier products from CJ using existing credential infrastructure. */
export async function pullCjSupplierProducts(
  keyword?: string,
  pageSize = 20,
): Promise<SupplierPullResult> {
  const result = await syncCjCatalog({ keyword, pageSize });
  return {
    products: result.products,
    source: result.source,
    integrationMode: result.integrationMode,
    pulledAt: result.syncedAt,
  };
}
