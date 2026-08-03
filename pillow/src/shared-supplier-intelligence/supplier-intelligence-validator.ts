/** X2-13 — Supplier Intelligence Validator. */

import { SSI_METADATA_VERSION } from "./paths.js";
import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type {
  ConsolidateSupplierKnowledgeInput,
  ShareSupplierIntelligenceInput,
  SupplierIntelligenceRecord,
  SupplierIntelligenceValidationReport,
  TrackSupplierPerformanceInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|agreement|nda)/i;

export class SupplierIntelligenceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): SupplierIntelligenceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `ssi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SSI_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Shared Supplier Intelligence disabled");
    if (!config.neverExposeConfidentialSupplierAgreements) {
      errors.push("Confidential supplier agreement guard must remain enabled");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.preserveSupplierTraceability) {
      errors.push("Supplier traceability must remain enabled");
    }
    if (!config.neverLogSensitiveSupplierInformation) {
      errors.push("Sensitive supplier log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateConsolidate(
    input: ConsolidateSupplierKnowledgeInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.supplierReference?.trim()) errors.push("Missing supplier reference");
    if (SENSITIVE.test(input.supplierReference ?? "")) {
      errors.push("Supplier reference must not contain sensitive data");
    }
    if (input.validated !== true) {
      errors.push("Supplier knowledge consolidation requires validated=true");
    }
    if (!config.supplierEvaluationRulesEnabled) {
      warnings.push("Supplier evaluation rules disabled");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validatePerformance(
    input: TrackSupplierPerformanceInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.supplierReference?.trim()) errors.push("Missing supplier reference");
    if (input.validated !== true) {
      errors.push("Supplier performance tracking requires validated=true");
    }
    if (!config.supplierEvaluationRulesEnabled) {
      warnings.push("Supplier evaluation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateShare(
    input: ShareSupplierIntelligenceInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.supplierReference?.trim()) errors.push("Missing supplier reference");
    if (!input.targetCompanies?.length) {
      errors.push("Share operation requires at least one target company");
    }
    if (input.validated !== true) {
      errors.push("Supplier intelligence sharing requires validated=true");
    }
    if (!config.supplierSharingRulesEnabled) {
      warnings.push("Supplier sharing rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: SupplierIntelligenceRecord): SupplierIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.supplierIntelligenceId.startsWith("ssi-")) {
      errors.push("Invalid supplier intelligence ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.sensitiveSupplierData) {
      errors.push("Sensitive supplier data must not enter intelligence records");
    }
    if (record.agreementSafe !== true) {
      errors.push("Records must remain agreement-safe");
    }
    if (record.structuralSignalOnly !== true) {
      errors.push("Records must remain structural signals only");
    }
    return this.report(started, errors, warnings);
  }
}
