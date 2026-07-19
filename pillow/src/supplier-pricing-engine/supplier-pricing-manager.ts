/** R2-07 — Supplier Pricing Manager. */

import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import { appendSpeLog } from "./spe-logging.js";
import { PriceSynchronizationEngine } from "./price-synchronization-engine.js";
import { PricingValidationEngine } from "./pricing-validation-engine.js";
import { PricingValidator } from "./pricing-validator.js";
import { PricingMetadataGenerator } from "./pricing-metadata-generator.js";
import {
  getChangeFixtures,
  getFixtureForSupplier,
  getFixturePricing,
} from "./supplier-pricing-fixtures.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import type {
  HistoricalPriceEntry,
  ReceiveSupplierPricingInput,
  SupplierPricingRecord,
  SupplierPricingSyncReport,
  SyncSupplierPricingInput,
} from "./types.js";

export class SupplierPricingManager {
  private pricing: SupplierPricingRecord[] = [];
  private history: HistoricalPriceEntry[] = [];
  private readonly syncEngine = new PriceSynchronizationEngine();
  private readonly validationEngine = new PricingValidationEngine();
  private readonly validator = new PricingValidator();
  private readonly metadataGenerator = new PricingMetadataGenerator();

  constructor(
    private readonly productSync: SupplierProductSyncEngine | null,
    private readonly inventorySync: SupplierInventorySyncEngine | null,
  ) {}

  getPricing(): SupplierPricingRecord[] {
    return [...this.pricing];
  }

  getHistory(): HistoricalPriceEntry[] {
    return [...this.history];
  }

  resolveRawPricing(input: SyncSupplierPricingInput) {
    if (input.rawPricing?.length) return input.rawPricing;

    if (input.changeFixtureMode && input.changeFixtureMode !== "none") {
      return getChangeFixtures(input.changeFixtureMode);
    }

    if (input.supplierId) {
      return getFixtureForSupplier(input.supplierId);
    }

    if (input.includeFixturePricing !== false) {
      return getFixturePricing();
    }

    return [];
  }

  syncSupplierPricing(
    input: SyncSupplierPricingInput,
    config: SupplierPricingEngineConfiguration,
  ): SupplierPricingSyncReport {
    const started = Date.now();
    const catalog = this.productSync?.getCatalog() ?? [];
    const rawPricing = this.resolveRawPricing(input);
    const invalidRecords = this.validationEngine.detectInvalidRawPricing(rawPricing);

    const validRaw = rawPricing.filter(
      (p) =>
        !invalidRecords.some(
          (inv) =>
            inv.supplierId === p.supplierId && inv.supplierProductId === p.supplierProductId,
        ),
    );

    const { pricing, changes, history } = this.syncEngine.synchronizePricing({
      previousPricing: this.pricing,
      rawPricing: validRaw,
      catalog,
      config,
    });

    const validation = this.validator.validateSyncResult({
      pricing,
      changes,
      config,
      startedAt: started,
    });

    if (validation.decision === "fail" && config.preserveExistingOnValidationFailure) {
      appendSpeLog({
        event: "pricing_validation_failed",
        level: "warn",
        details: `Validation failed — preserving existing pricing (${validation.errors.length} errors)`,
      });
    } else {
      this.pricing = pricing;
      this.history.push(...history);
    }

    const increases = changes.filter((c) => c.changeType === "increase").length;
    const decreases = changes.filter((c) => c.changeType === "decrease").length;
    const anomalies = changes.filter((c) => c.changeType === "anomaly").length;

    appendSpeLog({
      event: "price_synchronization",
      level: validation.decision === "fail" ? "error" : "info",
      details: `Synchronized ${validRaw.length} pricing records — increases: ${increases}, decreases: ${decreases}, anomalies: ${anomalies}`,
    });

    for (const change of changes) {
      if (change.changeType === "increase" || change.changeType === "decrease") {
        appendSpeLog({
          event: "price_change",
          level: "info",
          details: `${change.changeType} ${change.supplierId}/${change.supplierProductId}: ${change.previousPrice} → ${change.currentPrice}`,
        });
      }
      if (change.changeType === "anomaly") {
        appendSpeLog({
          event: "pricing_anomaly",
          level: "warn",
          details: `Anomaly ${change.supplierId}/${change.supplierProductId}: ${change.details}`,
        });
      }
    }

    return this.metadataGenerator.generateSyncReport({
      action: "sync",
      pricing: validation.decision === "fail" && config.preserveExistingOnValidationFailure
        ? this.pricing
        : pricing,
      changes,
      history: validation.decision === "fail" && config.preserveExistingOnValidationFailure
        ? []
        : history,
      invalidRecords,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.pricing = [];
    this.history = [];
  }

  receiveSupplierPricing(
    input: ReceiveSupplierPricingInput,
    config: SupplierPricingEngineConfiguration,
  ): SupplierPricingSyncReport {
    return this.syncSupplierPricing(
      {
        rawPricing: [
          {
            supplierId: input.supplierId,
            supplierProductId: input.supplierProductId,
            price: input.price,
            currency: input.currency,
            sourceData: input.sourceData,
          },
        ],
        includeFixturePricing: false,
      },
      config,
    );
  }
}
