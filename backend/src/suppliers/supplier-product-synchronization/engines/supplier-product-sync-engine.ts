import { loadCjConfig } from "../../cj-dropshipping/index.js";
import type { KnowledgeGraphModule } from "../../../intelligence/product-knowledge-graph/contract/knowledge-graph-module.js";
import { createKnowledgeGraphModule } from "../../../intelligence/product-knowledge-graph/contract/knowledge-graph-module.js";
import type { SupplierProductSyncRecord } from "../models/supplier-product-sync-record.js";
import type { SupplierProductSyncRepository } from "../repositories/supplier-product-sync-repository.js";
import {
  fetchCjCatalogItems,
  shouldUseCjLiveCatalog,
} from "../live/cj-catalog-provider.js";
import {
  buildStubCatalogForPlatform,
  syncSupplierCatalog,
  type SupplierProductSyncBreakdown,
  type SupplierProductSyncInput,
} from "../scoring/supplier-product-sync-scoring.js";

async function resolveCatalogInput(
  input: SupplierProductSyncInput,
): Promise<SupplierProductSyncInput> {
  if (input.catalogItems?.length) {
    return input;
  }

  if (shouldUseCjLiveCatalog(input.platform)) {
    const config = loadCjConfig();
    const catalogItems = await fetchCjCatalogItems({
      platform: input.platform,
      keyword: input.catalogSyncOptions?.keyword,
      pageSize: input.catalogSyncOptions?.pageSize,
      destinationCountryCode: input.catalogSyncOptions?.destinationCountryCode,
    });

    return {
      ...input,
      catalogItems,
      integrationMode: input.integrationMode ?? config.integrationMode,
    };
  }

  return {
    ...input,
    catalogItems: buildStubCatalogForPlatform(input.platform),
    integrationMode: input.integrationMode ?? "STUB",
  };
}

/** Syncs supplier catalog items into the Product Knowledge Graph. */
export class SupplierProductSyncEngine {
  constructor(
    private readonly repository: SupplierProductSyncRepository,
    private readonly knowledgeGraph: KnowledgeGraphModule = createKnowledgeGraphModule(),
  ) {}

  syncSupplierProducts(input: SupplierProductSyncInput): SupplierProductSyncBreakdown[] {
    return syncSupplierCatalog(input);
  }

  async syncAndSave(
    workspaceId: string,
    input: SupplierProductSyncInput,
  ): Promise<SupplierProductSyncRecord[]> {
    const resolvedInput = await resolveCatalogInput(input);
    const breakdowns = syncSupplierCatalog(resolvedInput);
    const records: SupplierProductSyncRecord[] = [];

    for (const breakdown of breakdowns) {
      const graphResult = await this.knowledgeGraph.upsertProductFromAliases(
        workspaceId,
        breakdown.knowledgeGraphInput,
      );

      const recordInput = {
        supplierProduct: {
          ...breakdown.supplierProduct,
          productEntityId: graphResult.entity.id,
          canonicalSlug: graphResult.entity.canonicalSlug,
        },
        supplierInventory: breakdown.supplierInventory,
        supplierPricing: breakdown.supplierPricing,
        supplierShippingData: breakdown.supplierShippingData,
        confidence: breakdown.confidence,
        signals: breakdown.signals,
      };

      records.push(await this.repository.save(workspaceId, recordInput));
    }

    return records;
  }
}
export const defaultSupplierProductSyncEngine = {
  syncSupplierProducts: syncSupplierCatalog,
};

export type { SupplierProductSyncInput };
