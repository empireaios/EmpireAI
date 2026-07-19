/** R5-19 — Autonomous Marketing Validator. */

import { AME_METADATA_VERSION, OPTIMIZATION_CATEGORIES } from "./paths.js";
import type { AutonomousMarketingEngineConfiguration } from "./configuration.js";
import type {
  AutonomousMarketingActionInput,
  AutonomousMarketingEngineRecord,
  AutonomousMarketingRecord,
  AutonomousMarketingValidationReport,
  MonitorPerformanceInput,
} from "./types.js";

export class AutonomousMarketingValidator {
  validateConfiguration(
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Autonomous Marketing Engine disabled");
    if (!config.validationRulesEnabled) {
      warnings.push("Validation rules disabled by configuration");
    }
    if (!config.neverExecuteHighImpactActionsWithoutApproval) {
      errors.push("High-impact execution protection must remain enabled");
    }
    if (!config.maskSensitiveValues) {
      errors.push("Sensitive value masking must remain enabled");
    }
    if (config.minConfidenceScore < 0 || config.minConfidenceScore > 100) {
      errors.push("Min confidence score must be between 0 and 100");
    }
    if (config.maxOptimizationsPerCycle <= 0) {
      errors.push("Max optimizations per cycle must be positive");
    }

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(
    record: AutonomousMarketingEngineRecord,
  ): AutonomousMarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("ame-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");

    const connected = Object.values(record.dependencyPresence).filter(Boolean).length;
    if (connected === 0) warnings.push("No autonomous marketing dependencies connected");
    if (!record.dependencyPresence.campaignManager) {
      warnings.push("Campaign Manager dependency not connected");
    }
    if (!record.dependencyPresence.crossChannelOrchestrator) {
      warnings.push("Cross-Channel Orchestrator dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateMonitor(
    input: MonitorPerformanceInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.optimizationRulesEnabled) {
      errors.push("Optimization rules disabled");
    }
    if (config.neverExecuteHighImpactActionsWithoutApproval && input.validated === false) {
      errors.push("Cannot run autonomous marketing operations without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateExecute(
    input: AutonomousMarketingActionInput,
    config: AutonomousMarketingEngineConfiguration,
  ): AutonomousMarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (!config.automationApprovalRulesEnabled) {
      errors.push("Automation approval rules disabled");
    }
    if (config.neverExecuteHighImpactActionsWithoutApproval && input.approved !== true) {
      errors.push("High-impact marketing actions require configured approval");
    }
    if (input.validated === false) {
      errors.push("Cannot execute approved optimizations without validation");
    }

    return this.build(errors, warnings, started);
  }

  validateAutonomousRecord(
    record: AutonomousMarketingRecord,
  ): AutonomousMarketingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.autonomousMarketingId.startsWith("ame-opt-")) {
      errors.push("Invalid autonomous marketing ID prefix");
    }
    if (!(OPTIMIZATION_CATEGORIES as readonly string[]).includes(record.optimizationCategory)) {
      errors.push(`Invalid optimization category: ${record.optimizationCategory}`);
    }
    if (record.highImpactExecuted !== false) {
      errors.push("High-impact live execution must remain false for structural autonomy");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.executionStatus === "blocked") {
      warnings.push("Optimization execution blocked pending approval");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): AutonomousMarketingValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ame-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AME_METADATA_VERSION,
    };
  }
}
