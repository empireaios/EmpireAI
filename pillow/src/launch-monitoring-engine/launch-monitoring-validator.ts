/** X1-13 — Launch Monitoring Validator. */

import { LME_METADATA_VERSION } from "./paths.js";
import type { LaunchMonitoringEngineConfiguration } from "./configuration.js";
import type {
  LaunchMonitoringEngineRecord,
  LaunchMonitoringRecord,
  LaunchMonitoringValidationReport,
  MonitorLaunchInput,
} from "./types.js";

export class LaunchMonitoringValidator {
  validateConfiguration(
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Launch Monitoring Engine disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverModifyProductionOperationsWithoutValidation) {
      errors.push("Production operation modification without validation must remain prohibited");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxMonitoringRecordsPerCycle < 1) {
      errors.push("maxMonitoringRecordsPerCycle must be >= 1");
    }
    if (config.monitoringFrequencySeconds < 1) {
      errors.push("monitoringFrequencySeconds must be >= 1");
    }
    if (config.alertThreshold < 0 || config.alertThreshold > 100) {
      errors.push("alertThreshold must be between 0 and 100");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(
    record: LaunchMonitoringEngineRecord,
  ): LaunchMonitoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("lme-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateMonitorInput(
    input: MonitorLaunchInput,
    config: LaunchMonitoringEngineConfiguration,
  ): LaunchMonitoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot monitor launch without validation acknowledgement");
    }
    if (!config.healthScoringRulesEnabled) warnings.push("Health scoring rules disabled");
    if (!config.anomalyDetectionEnabled) warnings.push("Anomaly detection disabled");
    if (!config.recommendationRulesEnabled) warnings.push("Recommendation rules disabled");

    return this.build(errors, warnings, started);
  }

  validateMonitoringRecord(
    record: LaunchMonitoringRecord,
  ): LaunchMonitoringValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.launchMonitoringId.startsWith("lme-mon-")) {
      errors.push("Invalid launch monitoring ID prefix");
    }
    if (record.fabricatedMonitoringFacts !== false) {
      errors.push("Fabricated monitoring facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Monitoring records must remain structural signals only");
    }
    if (record.modifiedProductionOperationsWithoutValidation !== false) {
      errors.push("Production operation modification without validation is forbidden");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.operationalHealthScore < 0 || record.operationalHealthScore > 100) {
      errors.push("Operational health score out of range");
    }
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.launchReference) warnings.push("Missing launch reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): LaunchMonitoringValidationReport {
    return {
      validationReportId: `lme-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LME_METADATA_VERSION,
    };
  }
}
