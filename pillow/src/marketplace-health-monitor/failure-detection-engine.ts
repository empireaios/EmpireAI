/** R1-14 — Failure detection engine. */

import { MHM_METADATA_VERSION } from "./paths.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type {
  FailureFinding,
  HealthValidationReport,
  MarketplaceHealthRecord,
} from "./types.js";

export class FailureDetectionEngine {
  detect(
    records: MarketplaceHealthRecord[],
    config: MarketplaceHealthMonitorConfiguration,
  ): FailureFinding[] {
    if (!config.failureDetectionRulesEnabled) return [];

    const failures: FailureFinding[] = [];

    for (const record of records) {
      if (record.overallHealthStatus === "failed") {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "connector",
          message: `Connector health failed for ${record.marketplaceIdentifier}`,
        });
      }
      if (record.authenticationStatus === "failed") {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "authentication",
          message: "Authentication health check failed",
        });
      }
      if (record.apiAvailability === "unavailable") {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "api",
          message: "API unavailable",
        });
      }
      if (record.rateLimitStatus === "throttled") {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "rate_limit",
          message: "Rate limit events detected",
        });
      }
      if (
        record.productSynchronizationStatus === "failed" ||
        record.orderSynchronizationStatus === "failed"
      ) {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "sync",
          message: "Synchronization pipeline failure detected",
        });
      }
      if (record.overallHealthStatus === "degraded") {
        failures.push({
          marketplaceIdentifier: record.marketplaceIdentifier,
          connectorId: record.connectorId,
          failureType: "connector",
          message: "Degraded connector performance detected",
        });
      }
    }

    return failures;
  }

  validateRecords(
    records: MarketplaceHealthRecord[],
    config: MarketplaceHealthMonitorConfiguration,
  ): HealthValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return {
        validationReportId: `mhm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "partial",
        errors: [],
        warnings: ["Validation rules disabled — structural pass"],
        durationMs: Date.now() - started,
        metadataVersion: MHM_METADATA_VERSION,
      };
    }

    for (const record of records) {
      if (!record.healthRecordId.startsWith("mhm-")) {
        errors.push(`${record.marketplaceIdentifier}: invalid health record ID prefix`);
      }
      if (!record.marketplaceIdentifier) {
        errors.push("Missing marketplace identifier");
      }
      if (!record.metadataVersion) {
        errors.push(`${record.marketplaceIdentifier}: missing metadata version`);
      }
      if (record.overallHealthStatus === "standby" && record.connectorId) {
        warnings.push(`${record.marketplaceIdentifier}: connector registered but health standby`);
      }
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `mhm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MHM_METADATA_VERSION,
    };
  }
}
