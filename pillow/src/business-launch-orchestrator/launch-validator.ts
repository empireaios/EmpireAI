/** X1-11 — Launch Validator. */

import { BLO_METADATA_VERSION } from "./paths.js";
import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";
import type {
  BusinessLaunchRecord,
  LaunchOrchestratorEngineRecord,
  LaunchOrchestratorValidationReport,
  OrchestrateLaunchInput,
} from "./types.js";

export class LaunchValidator {
  validateConfiguration(
    config: BusinessLaunchOrchestratorConfiguration,
  ): LaunchOrchestratorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Business Launch Orchestrator disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverLaunchWithoutReadinessValidation) {
      errors.push("Launch without readiness validation prohibition must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxLaunchesPerCycle < 1) errors.push("maxLaunchesPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(
    record: LaunchOrchestratorEngineRecord,
  ): LaunchOrchestratorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("blo-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    for (const [key, present] of Object.entries(record.dependencyPresence)) {
      if (!present) warnings.push(`Dependency not connected: ${key}`);
    }

    return this.build(errors, warnings, started);
  }

  validateOrchestrateInput(
    input: OrchestrateLaunchInput,
    config: BusinessLaunchOrchestratorConfiguration,
    readinessCertified: boolean,
  ): LaunchOrchestratorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot orchestrate launch without validation acknowledgement");
    }
    if (config.neverLaunchWithoutReadinessValidation && !readinessCertified) {
      errors.push("Cannot launch without successful launch readiness validation");
    }
    if (!config.launchWorkflowRulesEnabled) warnings.push("Launch workflow rules disabled");
    if (!config.dependencyRulesEnabled) warnings.push("Dependency rules disabled");

    return this.build(errors, warnings, started);
  }

  validateLaunchRecord(record: BusinessLaunchRecord): LaunchOrchestratorValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.launchId.startsWith("blo-lnc-")) errors.push("Invalid launch ID prefix");
    if (record.fabricatedLaunchFacts !== false) {
      errors.push("Fabricated launch facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Launch records must remain structural signals only");
    }
    if (record.launchedWithoutReadinessValidation !== false) {
      errors.push("Launch without readiness validation is forbidden");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.launchProgress < 0 || record.launchProgress > 100) {
      errors.push("Launch progress out of range");
    }
    if (!record.companyReference) warnings.push("Missing company reference");
    if (!record.readinessReference) warnings.push("Missing readiness reference");

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): LaunchOrchestratorValidationReport {
    return {
      validationReportId: `blo-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BLO_METADATA_VERSION,
    };
  }
}
