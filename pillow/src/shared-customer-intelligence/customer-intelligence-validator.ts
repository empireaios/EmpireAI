/** X2-12 — Customer Intelligence Validator. */

import { SCI_METADATA_VERSION } from "./paths.js";
import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeCustomerBehaviourInput,
  ConsolidateCustomerKnowledgeInput,
  CustomerIntelligenceRecord,
  CustomerIntelligenceValidationReport,
  ResolveCustomerIdentityInput,
} from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|ssn|email@|phone)/i;

export class CustomerIntelligenceValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): CustomerIntelligenceValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `sci-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCI_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Shared Customer Intelligence disabled");
    if (!config.privacyRulesEnabled) errors.push("Privacy rules must remain enabled");
    if (!config.neverViolateCustomerPrivacyPolicies) {
      errors.push("Customer privacy policy guard must remain enabled");
    }
    if (!config.neverExposeCredentials) {
      errors.push("Credential protection must remain enabled");
    }
    if (!config.preserveCustomerTraceability) {
      errors.push("Customer traceability must remain enabled");
    }
    if (!config.neverLogSensitiveCustomerInformation) {
      errors.push("Sensitive customer log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateConsolidate(
    input: ConsolidateCustomerKnowledgeInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.customerReference?.trim()) errors.push("Missing customer reference");
    if (SENSITIVE.test(input.customerReference ?? "")) {
      errors.push("Customer reference must not contain sensitive data");
    }
    if (input.validated !== true) {
      errors.push("Customer knowledge consolidation requires validated=true");
    }
    if (!config.customerMatchingRulesEnabled) warnings.push("Customer matching rules disabled");
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }

  validateResolve(
    input: ResolveCustomerIdentityInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.customerReference?.trim()) errors.push("Missing customer reference");
    if (!input.companyReferences?.length) {
      errors.push("Identity resolution requires at least one company reference");
    }
    if (input.validated !== true) {
      errors.push("Identity resolution requires validated=true");
    }
    if (!config.customerMatchingRulesEnabled) warnings.push("Customer matching rules disabled");
    return this.report(started, errors, warnings);
  }

  validateBehaviour(
    input: AnalyzeCustomerBehaviourInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!input.customerReference?.trim()) errors.push("Missing customer reference");
    if (input.validated !== true) {
      errors.push("Behaviour analysis requires validated=true");
    }
    if (!config.insightGenerationRulesEnabled) {
      warnings.push("Insight generation rules disabled");
    }
    return this.report(started, errors, warnings);
  }

  validateRecord(record: CustomerIntelligenceRecord): CustomerIntelligenceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!record.customerIntelligenceId.startsWith("sci-")) {
      errors.push("Invalid customer intelligence ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.sensitiveCustomerData) {
      errors.push("Sensitive customer data must not enter intelligence records");
    }
    if (record.privacySafe !== true) errors.push("Records must remain privacy-safe");
    if (record.structuralSignalOnly !== true) {
      errors.push("Records must remain structural signals only");
    }
    return this.report(started, errors, warnings);
  }
}
