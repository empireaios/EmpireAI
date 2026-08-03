/** X3-06 — Supplier Validator. */

import { SSE_METADATA_VERSION } from "./paths.js";
import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type { SupplierScaleInput, SupplierValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class SupplierValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): SupplierValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `sse-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SSE_METADATA_VERSION,
    };
  }

  validateConfiguration(config: SupplierScaleEngineConfiguration): SupplierValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Supplier Scale Engine disabled");
    if (!config.neverRecommendSupplierExpansionWithoutValidatedCapacity) {
      errors.push(
        "Must never recommend supplier expansion without validated capacity",
      );
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveSupplierTraceability) {
      errors.push("Supplier traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveSupplierInformation) {
      errors.push("Sensitive supplier log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateSupplier(
    label: string,
    input: SupplierScaleInput,
    config: SupplierScaleEngineConfiguration,
  ): SupplierValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never recommend supplier expansion without validated capacity`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.supplierReference && SENSITIVE.test(input.supplierReference)) {
      errors.push("Supplier reference must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverRecommendSupplierExpansionWithoutValidatedCapacity) {
      errors.push("Supplier expansion without validated capacity is forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
