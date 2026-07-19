/** R2-07 — Supplier pricing mapper. */

import type { SupplierProductRecord } from "../supplier-product-sync/types.js";
import type { RawSupplierPricingPayload, SupplierPricingRecord } from "./types.js";
import { SPE_METADATA_VERSION } from "./paths.js";
import { CurrencyHandler } from "./currency-handler.js";
import { CostCalculationEngine } from "./cost-calculation-engine.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";

export class SupplierPricingMapper {
  private readonly currencyHandler = new CurrencyHandler();
  private readonly costEngine = new CostCalculationEngine();

  mapRawToPricingRecord(input: {
    raw: RawSupplierPricingPayload;
    catalog: SupplierProductRecord[];
    previousPrice: number | null;
    config: SupplierPricingEngineConfiguration;
  }): SupplierPricingRecord {
    const { raw, catalog, previousPrice, config } = input;
    const internalProductId =
      catalog.find(
        (c) => c.supplierId === raw.supplierId && c.supplierProductId === raw.supplierProductId,
      )?.productId ?? null;

    const currency = this.currencyHandler.normalizeCurrency(raw.currency);
    const currentSupplierPrice = this.currencyHandler.normalizePrice(raw.price, currency);
    const priceChangeAmount =
      previousPrice !== null ? currentSupplierPrice - previousPrice : null;
    const priceChangePercentage =
      previousPrice !== null && previousPrice > 0
        ? ((currentSupplierPrice - previousPrice) / previousPrice) * 100
        : null;

    const landedCost = config.landedCostRulesEnabled
      ? this.costEngine.calculateLandedCost({
          supplierPrice: currentSupplierPrice,
          config,
        })
      : null;

    return {
      pricingRecordId: `spe-${raw.supplierId}-${raw.supplierProductId}`,
      supplierId: raw.supplierId,
      supplierProductId: raw.supplierProductId,
      internalProductId,
      currentSupplierPrice,
      previousSupplierPrice: previousPrice,
      currency,
      priceChangeAmount,
      priceChangePercentage,
      landedCost,
      effectiveTimestamp: new Date().toISOString(),
      validationStatus: "pending",
      metadataVersion: SPE_METADATA_VERSION,
    };
  }
}
