/** R2-07 — Price Synchronization Engine. */

import type { SupplierProductRecord } from "../supplier-product-sync/types.js";
import type {
  HistoricalPriceEntry,
  RawSupplierPricingPayload,
  SupplierPricingRecord,
} from "./types.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import { SupplierPricingMapper } from "./supplier-pricing-mapper.js";
import { PriceChangeDetector } from "./price-change-detector.js";

export class PriceSynchronizationEngine {
  private readonly mapper = new SupplierPricingMapper();
  private readonly changeDetector = new PriceChangeDetector();

  synchronizePricing(input: {
    previousPricing: SupplierPricingRecord[];
    rawPricing: RawSupplierPricingPayload[];
    catalog: SupplierProductRecord[];
    config: SupplierPricingEngineConfiguration;
  }): {
    pricing: SupplierPricingRecord[];
    changes: ReturnType<PriceChangeDetector["detectChanges"]>;
    history: HistoricalPriceEntry[];
  } {
    const prevMap = new Map(
      input.previousPricing.map((p) => [`${p.supplierId}:${p.supplierProductId}`, p]),
    );
    const seen = new Set<string>();
    const pricing: SupplierPricingRecord[] = [];
    const history: HistoricalPriceEntry[] = [];

    for (const raw of input.rawPricing) {
      const key = `${raw.supplierId}:${raw.supplierProductId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const previous = prevMap.get(key);
      const record = this.mapper.mapRawToPricingRecord({
        raw,
        catalog: input.catalog,
        previousPrice: previous?.currentSupplierPrice ?? null,
        config: input.config,
      });

      pricing.push(record);
      history.push({
        entryId: `spe-hist-${key}-${Date.now()}`,
        supplierId: raw.supplierId,
        supplierProductId: raw.supplierProductId,
        price: record.currentSupplierPrice,
        currency: record.currency,
        recordedAt: record.effectiveTimestamp,
      });
    }

    const unchanged = input.previousPricing.filter(
      (p) => !seen.has(`${p.supplierId}:${p.supplierProductId}`),
    );
    pricing.push(...unchanged);

    const changes = this.changeDetector.detectChanges({
      previousPricing: input.previousPricing,
      currentPricing: pricing,
      config: input.config,
    });

    return { pricing, changes, history };
  }
}
