/** X1-06 — Digital Asset Validator. */

import { DAP_METADATA_VERSION } from "./paths.js";
import type { DomainDigitalAssetPlannerConfiguration } from "./configuration.js";
import type {
  CreateDigitalAssetPlanInput,
  DigitalAssetEngineRecord,
  DigitalAssetPlanRecord,
  DigitalAssetValidationReport,
} from "./types.js";

export class DigitalAssetValidator {
  validateConfiguration(
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled) warnings.push("Domain & Digital Asset Planner disabled");
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverAutoRegisterOrPurchase) {
      errors.push("Automatic registration/purchase must remain disabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only mode must remain enabled");
    }
    if (!config.maskSensitiveValues) errors.push("Sensitive value masking must remain enabled");
    if (config.maxPlansPerCycle < 1) errors.push("maxPlansPerCycle must be >= 1");

    return this.build(errors, warnings, started);
  }

  validateEngineRecord(record: DigitalAssetEngineRecord): DigitalAssetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.engineRecordId.startsWith("dap-")) errors.push("Invalid engine record ID prefix");
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.dependencyPresence.companyFactoryFramework) {
      warnings.push("Company Factory Framework dependency not connected");
    }
    if (!record.dependencyPresence.businessModelGenerator) {
      warnings.push("Business Model Generator dependency not connected");
    }
    if (!record.dependencyPresence.brandCreationEngine) {
      warnings.push("Brand Creation Engine dependency not connected");
    }

    return this.build(errors, warnings, started);
  }

  validateCreateInput(
    input: CreateDigitalAssetPlanInput,
    config: DomainDigitalAssetPlannerConfiguration,
  ): DigitalAssetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return this.build([], ["Validation rules disabled"], started);
    }
    if (input.validated === false) {
      errors.push("Cannot run digital asset planning without validation acknowledgement");
    }
    if (!config.domainPlanningRulesEnabled) warnings.push("Domain planning rules disabled");
    if (!config.namingValidationRulesEnabled) warnings.push("Naming validation rules disabled");
    if (!config.websitePlanningRulesEnabled) warnings.push("Website planning rules disabled");

    return this.build(errors, warnings, started);
  }

  validatePlanRecord(record: DigitalAssetPlanRecord): DigitalAssetValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.digitalAssetPlanId.startsWith("dap-plan-")) {
      errors.push("Invalid digital asset plan ID prefix");
    }
    if (record.fabricatedDigitalAssetFacts !== false) {
      errors.push("Fabricated digital asset facts are forbidden");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Plan records must remain structural signals only");
    }
    if (record.automaticRegistrationOrPurchase !== false) {
      errors.push("Automatic registration or purchase must remain false");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (!record.proposedCompanyDomain) errors.push("Missing proposed company domain");
    if (!record.brandReference) warnings.push("Missing brand reference");
    if (!record.websiteArchitectureSummary) warnings.push("Missing website architecture summary");
    if (
      record.namingConflictSummary &&
      record.namingConflictSummary !== "no structural naming conflicts detected"
    ) {
      warnings.push("Naming conflicts require review before any registration");
    }

    return this.build(errors, warnings, started);
  }

  private build(
    errors: string[],
    warnings: string[],
    started: number,
  ): DigitalAssetValidationReport {
    return {
      validationReportId: `dap-val-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      validationTimestamp: new Date().toISOString(),
      decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DAP_METADATA_VERSION,
    };
  }
}
