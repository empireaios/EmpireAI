/** R1-14 — Health validator. */

import { MHM_METADATA_VERSION, HEALTH_RECORD_SCHEMA_VERSION } from "./paths.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type {
  FailureFinding,
  HealthAlert,
  HealthValidationReport,
  MarketplaceHealthRecord,
} from "./types.js";

export class HealthValidator {
  validateHealthCheckResult(input: {
    records: MarketplaceHealthRecord[];
    alerts: HealthAlert[];
    failures: FailureFinding[];
    config: MarketplaceHealthMonitorConfiguration;
    baseValidation: HealthValidationReport;
  }): HealthValidationReport {
    const started = Date.now();
    const errors = [...input.baseValidation.errors];
    const warnings = [...input.baseValidation.warnings];

    if (input.failures.length > 0 && input.config.failureDetectionRulesEnabled) {
      warnings.push(`${input.failures.length} integration failure(s) detected`);
    }

    if (input.alerts.length > 0 && input.config.alertThresholdsEnabled) {
      warnings.push(`${input.alerts.length} active health alert(s)`);
    }

    for (const record of input.records) {
      if (record.metadataVersion !== MHM_METADATA_VERSION) {
        warnings.push(`${record.marketplaceIdentifier}: metadata version mismatch`);
      }
      if (record.healthRecordId && !record.healthRecordId.startsWith("mhm-")) {
        errors.push(`${record.marketplaceIdentifier}: invalid health record prefix`);
      }
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : input.baseValidation.decision;

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
