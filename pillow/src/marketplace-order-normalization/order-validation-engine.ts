/** R1-13 — Order validation engine. */

import { MON_METADATA_VERSION } from "./paths.js";
import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type {
  InvalidOrderFinding,
  MissingAttributeFinding,
  NormalizedOrderRecord,
  OrderNormalizationValidationReport,
  RawMarketplaceOrderPayload,
} from "./types.js";
import { OrderAttributeMapper } from "./order-attribute-mapper.js";
import { UnifiedOrderSchemaEngine } from "./unified-order-schema-engine.js";

const REQUIRED_FIELDS = ["marketplaceOrderId", "orderStatus", "orderItems"];
const OPTIONAL_FIELDS = ["customerReference", "paymentStatus", "fulfilmentStatus"];

export class OrderValidationEngine {
  private readonly attributeMapper = new OrderAttributeMapper();
  private readonly schemaEngine = new UnifiedOrderSchemaEngine();

  validateConfiguration(
    config: MarketplaceOrderNormalizationConfiguration,
  ): OrderNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.orderSchemaRulesEnabled) warnings.push("Order schema rules disabled");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  validateOrder(record: NormalizedOrderRecord): OrderNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.orderId.startsWith("mon-")) errors.push("Invalid order ID prefix");
    if (!record.marketplaceOrderId) errors.push("Missing marketplace order ID");
    if (!record.orderStatus?.trim()) errors.push("Missing order status");
    if (!this.schemaEngine.isSupportedMarketplace(record.marketplaceIdentifier)) {
      errors.push(`Unsupported marketplace: ${record.marketplaceIdentifier}`);
    }
    if (!record.schemaVersion) errors.push("Missing schema version");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.orderItems.length === 0) errors.push("Order has no line items");
    if (!record.marketplaceMetadata || Object.keys(record.marketplaceMetadata).length === 0) {
      warnings.push("Missing marketplace metadata");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  validateCatalog(
    orders: NormalizedOrderRecord[],
    config: MarketplaceOrderNormalizationConfiguration,
  ): OrderNormalizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `mon-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: MON_METADATA_VERSION,
      };
    }

    const ids = new Set<string>();
    for (const order of orders) {
      const result = this.validateOrder(order);
      if (result.decision === "fail") {
        errors.push(...result.errors.map((e) => `${order.orderId}: ${e}`));
      }
      if (ids.has(order.orderId)) {
        errors.push(`Duplicate normalized order ID: ${order.orderId}`);
      }
      ids.add(order.orderId);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

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

  detectMissingAttributes(
    orders: NormalizedOrderRecord[],
    config: MarketplaceOrderNormalizationConfiguration,
  ): MissingAttributeFinding[] {
    if (!config.validationRulesEnabled) return [];

    const findings: MissingAttributeFinding[] = [];

    for (const order of orders) {
      const missing = this.attributeMapper.detectMissingFields(order, [
        ...REQUIRED_FIELDS,
        ...OPTIONAL_FIELDS,
      ]);
      if (missing.length > 0) {
        findings.push({
          orderId: order.orderId,
          marketplaceIdentifier: order.marketplaceIdentifier,
          missingFields: missing,
        });
      }
    }

    return findings;
  }

  detectInvalidRawOrders(payloads: RawMarketplaceOrderPayload[]): InvalidOrderFinding[] {
    const findings: InvalidOrderFinding[] = [];

    for (const payload of payloads) {
      const errors: string[] = [];
      if (!payload.marketplaceOrderId?.trim()) errors.push("Missing marketplace order ID");
      if (!this.schemaEngine.isSupportedMarketplace(payload.marketplaceIdentifier)) {
        errors.push(`Unsupported marketplace: ${payload.marketplaceIdentifier}`);
      }
      const status = payload.sourceData.order_status ?? payload.sourceData.status ?? payload.sourceData.orderStatus;
      if (!status) errors.push("Missing order status in source data");

      if (errors.length > 0) {
        findings.push({
          marketplaceIdentifier: payload.marketplaceIdentifier,
          marketplaceOrderId: payload.marketplaceOrderId,
          errors,
        });
      }
    }

    return findings;
  }
}
