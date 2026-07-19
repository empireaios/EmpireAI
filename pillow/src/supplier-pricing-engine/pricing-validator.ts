/** R2-07 — Pricing Validator. */

import type {
  PriceChangeFinding,
  SupplierPricingRecord,
  SupplierPricingValidationReport,
} from "./types.js";
import type { SupplierPricingEngineConfiguration } from "./configuration.js";
import { SPE_METADATA_VERSION } from "./paths.js";
import { PricingValidationEngine } from "./pricing-validation-engine.js";

export class PricingValidator {
  private readonly validationEngine = new PricingValidationEngine();

  validateSyncResult(input: {
    pricing: SupplierPricingRecord[];
    changes: PriceChangeFinding[];
    config: SupplierPricingEngineConfiguration;
    startedAt: number;
  }): SupplierPricingValidationReport {
    const { errors, warnings } = this.validationEngine.validatePricing(
      input.pricing,
      input.config,
    );

    const anomalyChanges = input.changes.filter((c) => c.changeType === "anomaly");
    if (anomalyChanges.length) {
      warnings.push(`${anomalyChanges.length} abnormal price movement(s) detected`);
    }

    let decision: SupplierPricingValidationReport["decision"] = "pass";
    if (errors.length) {
      decision = warnings.length ? "partial" : "fail";
    } else if (warnings.length) {
      decision = "partial";
    }

    const validatedPricing = input.pricing.map((p) => ({
      ...p,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));

    input.pricing.splice(0, input.pricing.length, ...validatedPricing);

    return {
      validationReportId: `spe-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: SPE_METADATA_VERSION,
    };
  }
}
