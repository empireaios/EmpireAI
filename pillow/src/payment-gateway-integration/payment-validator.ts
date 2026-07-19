/** R3-02 — Payment validator. */

import { PG_METADATA_VERSION } from "./paths.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type {
  CreatePaymentRequestInput,
  GatewayRecord,
  PaymentRecord,
  PaymentValidationReport,
} from "./types.js";

export class PaymentValidator {
  validateConfiguration(config: PaymentGatewayIntegrationConfiguration): PaymentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.credentialRef) warnings.push("Credential reference not configured");
    if (!config.gatewayRegistrationRulesEnabled) {
      warnings.push("Gateway registration rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PG_METADATA_VERSION,
    };
  }

  validateGatewayRecord(record: GatewayRecord): PaymentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.gatewayRecordId.startsWith("pg-")) errors.push("Invalid gateway record ID prefix");
    if (record.healthStatus === "failed") warnings.push("Gateway health is failed");
    if (record.currentOperationalState !== "active") {
      warnings.push(`Gateway not active: ${record.currentOperationalState}`);
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PG_METADATA_VERSION,
    };
  }

  validatePaymentRequest(
    input: CreatePaymentRequestInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.customerReference) errors.push("Missing customer reference");
    if (!input.orderReference) errors.push("Missing order reference");
    if (!Number.isFinite(input.paymentAmount) || input.paymentAmount <= 0) {
      errors.push("Invalid payment amount");
    }
    if (!config.paymentProcessingRulesEnabled) {
      warnings.push("Payment processing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PG_METADATA_VERSION,
    };
  }

  validatePaymentRecord(record: PaymentRecord): PaymentValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.paymentId.startsWith("pg-pay-")) errors.push("Invalid payment ID prefix");
    if (!record.transactionId) errors.push("Missing transaction ID");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `pg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PG_METADATA_VERSION,
    };
  }
}
