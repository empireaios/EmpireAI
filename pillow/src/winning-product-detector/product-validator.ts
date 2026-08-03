/** X3-02 — Product Validator. */

import { WPD_METADATA_VERSION } from "./paths.js";
import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type { ProductAnalysisInput, ProductValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key)/i;

export class ProductValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): ProductValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `wpd-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WPD_METADATA_VERSION,
    };
  }

  validateConfiguration(config: WinningProductDetectorConfiguration): ProductValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Winning Product Detector disabled");
    if (!config.neverManipulateProductPerformanceData) {
      errors.push("Product performance data must never be manipulated");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveProductTraceability) {
      errors.push("Product traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateAnalysis(
    label: string,
    input: ProductAnalysisInput,
    config: WinningProductDetectorConfiguration,
  ): ProductValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(`${label} requires validated=true`);
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.productReference && SENSITIVE.test(input.productReference)) {
      errors.push("Product reference must not contain sensitive data");
    }
    if (!config.productEvaluationRulesEnabled) {
      warnings.push("Product evaluation rules disabled");
    }
    if (!config.neverManipulateProductPerformanceData) {
      errors.push("Product performance manipulation is forbidden");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    return this.report(started, errors, warnings);
  }
}
