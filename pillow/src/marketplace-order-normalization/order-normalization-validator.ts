/** R1-13 — Order normalization validator. */

import { MON_METADATA_VERSION, UNIFIED_ORDER_SCHEMA_VERSION } from "./paths.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type {
  DuplicateOrderGroup,
  InvalidOrderFinding,
  MissingAttributeFinding,
  NormalizedOrderRecord,
  OrderNormalizationValidationReport,
} from "./types.js";

export class OrderNormalizationValidator {
  validateNormalizationResult(input: {
    orders: NormalizedOrderRecord[];
    duplicates: DuplicateOrderGroup[];
    missingAttributes: MissingAttributeFinding[];
    invalidOrders: InvalidOrderFinding[];
    config: MarketplaceOrderNormalizationConfiguration;
    baseValidation: OrderNormalizationValidationReport;
  }): OrderNormalizationValidationReport {
    const started = Date.now();
    const errors = [...input.baseValidation.errors];
    const warnings = [...input.baseValidation.warnings];

    if (input.invalidOrders.length > 0) {
      for (const invalid of input.invalidOrders) {
        warnings.push(
          `Skipped invalid raw order ${invalid.marketplaceIdentifier}/${invalid.marketplaceOrderId}: ${invalid.errors.join("; ")}`,
        );
      }
    }

    if (input.duplicates.length > 0 && input.config.duplicateDetectionRulesEnabled) {
      warnings.push(`${input.duplicates.length} duplicate order group(s) detected`);
    }

    if (input.missingAttributes.length > 0) {
      warnings.push(`${input.missingAttributes.length} order(s) with missing attributes`);
    }

    for (const order of input.orders) {
      if (order.schemaVersion !== UNIFIED_ORDER_SCHEMA_VERSION) {
        errors.push(`${order.orderId}: invalid schema version`);
      }
      if (order.metadataVersion !== MON_METADATA_VERSION) {
        warnings.push(`${order.orderId}: metadata version mismatch`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : input.baseValidation.decision;

    return {
      validationReportId: `mon-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MON_METADATA_VERSION,
    };
  }
}
