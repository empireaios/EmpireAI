/** R1-03 — Amazon catalog sync engine. */

import { appendProductLog } from "./amzprod-logging.js";
import type { AmazonProductApiClient } from "./amazon-product-api-client.js";
import type { AmazonProductMapper } from "./amazon-product-mapper.js";
import type { AmazonProductChangeDetector } from "./amazon-product-change-detector.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type {
  AmazonProductChangeSet,
  AmazonProductRecord,
  SyncAmazonProductsInput,
} from "./types.js";

export class AmazonCatalogSyncEngine {
  constructor(
    private readonly apiClient: AmazonProductApiClient,
    private readonly mapper: AmazonProductMapper,
    private readonly changeDetector: AmazonProductChangeDetector,
  ) {}

  async sync(
    previousCatalog: AmazonProductRecord[],
    config: AmazonProductIntelligenceConfiguration,
    input: SyncAmazonProductsInput = {},
    syncOptions?: { updatedTitle?: string; omitAsin?: string },
  ): Promise<{
    catalog: AmazonProductRecord[];
    changes: AmazonProductChangeSet;
  }> {
    const region = input.region ?? "na";
    appendProductLog({
      event: "catalog_sync_start",
      level: "info",
      details: `Starting Amazon catalog sync (forceFull=${Boolean(input.forceFullSync)})`,
    });

    const raw = await this.apiClient.fetchCatalogListings(region, config, syncOptions);
    const mapped = this.mapper.mapBatch(raw, config, "synced");
    const changes = this.changeDetector.detect(previousCatalog, mapped);

    const catalog = this.mergeCatalog(previousCatalog, mapped, changes, config);

    appendProductLog({
      event: "catalog_sync_complete",
      level: "info",
      details: `Sync complete: ${changes.newProducts.length} new, ${changes.updatedProducts.length} updated, ${changes.inactiveProducts.length} inactive`,
    });

    return { catalog, changes };
  }

  private mergeCatalog(
    previous: AmazonProductRecord[],
    current: AmazonProductRecord[],
    changes: AmazonProductChangeSet,
    _config: AmazonProductIntelligenceConfiguration,
  ): AmazonProductRecord[] {
    void previous;
    const result: AmazonProductRecord[] = [];

    for (const p of current) {
      const isNew = changes.newProducts.some((n) => n.amazonAsin === p.amazonAsin);
      const isUpdated = changes.updatedProducts.some((u) => u.amazonAsin === p.amazonAsin);
      result.push({
        ...p,
        synchronizationStatus: isNew ? "new" : isUpdated ? "updated" : "synced",
      });
    }

    for (const inactive of changes.inactiveProducts) {
      result.push(inactive);
    }

    return result;
  }
}
