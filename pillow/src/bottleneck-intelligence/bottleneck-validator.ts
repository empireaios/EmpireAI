/** X3-10 — Bottleneck Validator. */

import { BNI_METADATA_VERSION } from "./paths.js";
import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type { BottleneckIntelligenceInput, BottleneckValidationReport } from "./types.js";

const SENSITIVE = /(token|secret|password|credential|api[_-]?key|payroll|ssn|salary)/i;

export class BottleneckValidator {
  private report(
    started: number,
    errors: string[],
    warnings: string[],
  ): BottleneckValidationReport {
    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";
    return {
      validationReportId: `bni-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BNI_METADATA_VERSION,
    };
  }

  validateConfiguration(
    config: BottleneckIntelligenceConfiguration,
  ): BottleneckValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.enabled) warnings.push("Bottleneck Intelligence disabled");
    if (!config.neverGenerateUnsupportedBottleneckConclusions) {
      errors.push("Must never generate unsupported bottleneck conclusions");
    }
    if (!config.neverExposeCredentials) errors.push("Credential protection must remain enabled");
    if (!config.neverExposeAuthenticationTokens) {
      errors.push("Authentication token protection must remain enabled");
    }
    if (!config.preserveBottleneckTraceability) {
      errors.push("Bottleneck traceability must remain enabled");
    }
    if (!config.preserveEnterpriseIntegrity) {
      errors.push("Enterprise integrity must remain enabled");
    }
    if (!config.structuralSignalsOnly) {
      errors.push("Structural signals only must remain enabled");
    }
    if (!config.neverLogSensitiveOperationalInformation) {
      errors.push("Sensitive operational log guard must remain enabled");
    }
    return this.report(started, errors, warnings);
  }

  validateBottleneck(
    label: string,
    input: BottleneckIntelligenceInput,
    config: BottleneckIntelligenceConfiguration,
  ): BottleneckValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.validated !== true) {
      errors.push(
        `${label} requires validated=true — never generate unsupported bottleneck conclusions`,
      );
    }
    if (input.companyReference && SENSITIVE.test(input.companyReference)) {
      errors.push("Company reference must not contain sensitive data");
    }
    if (input.affectedComponent && SENSITIVE.test(input.affectedComponent)) {
      errors.push("Affected component must not contain sensitive data");
    }
    if (!config.validationRulesEnabled) warnings.push("Validation rules disabled");
    if (!config.neverGenerateUnsupportedBottleneckConclusions) {
      errors.push("Unsupported bottleneck conclusions are forbidden");
    }
    return this.report(started, errors, warnings);
  }
}
