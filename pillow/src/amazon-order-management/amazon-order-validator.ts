/** R1-04 — Amazon order validator. */

import { AMAZON_ORDER_METADATA_VERSION } from "./paths.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type { AmazonOrderRecord, AmazonOrderValidationReport } from "./types.js";

export class AmazonOrderValidator {
  validateConfiguration(
    config: AmazonOrderManagementConfiguration,
  ): AmazonOrderValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.syncFrequencyMinutes < 1) {
      warnings.push("Sync frequency below 1 minute may cause excessive API calls");
    }
    if (!config.validationRulesEnabled) {
      warnings.push("Order validation rules disabled");
    }
    if (config.allowOrderModification) {
      warnings.push("Order modification enabled — requires approved workflow");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzord-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_ORDER_METADATA_VERSION,
    };
  }

  validateOrder(record: AmazonOrderRecord): AmazonOrderValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.orderId.startsWith("amzord-")) errors.push("Invalid order ID prefix");
    if (!record.amazonOrderId) errors.push("Missing Amazon order ID");
    if (record.marketplaceId !== "amazon") errors.push("Invalid marketplace identifier");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.sourceApiReference) warnings.push("Missing source API reference");
    if (record.quantity <= 0) errors.push("Invalid order quantity");
    if (record.price < 0) errors.push("Invalid order price");
    if (!record.currency) errors.push("Missing currency");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzord-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_ORDER_METADATA_VERSION,
    };
  }

  validateOrders(
    orders: AmazonOrderRecord[],
    config: AmazonOrderManagementConfiguration,
  ): AmazonOrderValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `amzord-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: AMAZON_ORDER_METADATA_VERSION,
      };
    }

    const ids = new Set<string>();
    for (const order of orders) {
      const result = this.validateOrder(order);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${order.amazonOrderId}: ${e}`));
      }
      if (ids.has(order.amazonOrderId)) {
        errors.push(`Duplicate order ID: ${order.amazonOrderId}`);
      }
      ids.add(order.amazonOrderId);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `amzord-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AMAZON_ORDER_METADATA_VERSION,
    };
  }
}
