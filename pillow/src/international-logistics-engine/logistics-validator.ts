/** X4-08 — Logistics Validator. */

import { ILE_METADATA_VERSION } from "./paths.js";
import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type { LogisticsAnalysisInput, LogisticsValidationReport } from "./types.js";

export class LogisticsValidator {
  validateConfiguration(
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.neverRecommendWithUnvalidatedLogisticsData) {
      errors.push("Must never generate shipping recommendations from unvalidated logistics data");
    }
    if (!config.preserveLogisticsTraceability) {
      errors.push("Logistics traceability must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode required for X4-08");
    }
    if (!config.enabled) warnings.push("International Logistics Engine disabled");
    return {
      validationReportId: `ile-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ILE_METADATA_VERSION,
    };
  }

  validateInput(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) errors.push("International Logistics Engine is disabled");
    if (config.validationRulesEnabled && input.validated !== true) {
      errors.push("International logistics requires validated=true");
    }
    if (!config.logisticsProviderRulesEnabled) {
      warnings.push("Logistics provider rules disabled");
    }
    if (!input.originRegion?.trim() || !input.destinationRegion?.trim()) {
      warnings.push("Origin/destination incomplete — default structural regions will be used");
    }
    return {
      validationReportId: `ile-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ILE_METADATA_VERSION,
    };
  }
}
