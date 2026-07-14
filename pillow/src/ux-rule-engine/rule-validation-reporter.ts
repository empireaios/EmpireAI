/** T2-01 — Rule validation report generation. */

import { RULE_METADATA_VERSION } from "./paths.js";
import type { UxRuleEngineConfiguration } from "./configuration.js";
import type {
  RuleEvaluationResult,
  RuleValidationReport,
  ValidationDecision,
} from "./types.js";

export class RuleValidationReporter {
  buildReport(input: {
    results: RuleEvaluationResult[];
    errors: string[];
    warnings: string[];
    durationMs: number;
    config: UxRuleEngineConfiguration;
  }): RuleValidationReport {
    const evaluated = input.results.filter((r) => !r.skipped);
    const skipped = input.results.filter((r) => r.skipped);
    const passed = evaluated.filter((r) => r.passed);
    const failed = evaluated.filter((r) => !r.passed);
    const violations = failed
      .map((r) => r.violation)
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const hasCritical = violations.some((v) => v.severity === "critical");
    const hasError = violations.some((v) => v.severity === "error");

    let decision: ValidationDecision = "pass";
    if (failed.length > 0) {
      if (input.config.failOnCriticalViolations && hasCritical) {
        decision = "fail";
      } else if (hasError || hasCritical) {
        decision = input.config.allowPartialResults ? "partial" : "fail";
      } else if (input.config.allowPartialResults) {
        decision = "partial";
      } else {
        decision = "fail";
      }
    }

    return {
      validationReportId: `ux-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      totalRules: input.results.length,
      rulesEvaluated: evaluated.length,
      rulesPassed: passed.length,
      rulesFailed: failed.length,
      rulesSkipped: skipped.length,
      results: input.results,
      violations,
      errors: input.errors,
      warnings: input.warnings,
      durationMs: input.durationMs,
      metadataVersion: RULE_METADATA_VERSION,
    };
  }
}
