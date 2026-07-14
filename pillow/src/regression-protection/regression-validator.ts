/** T3-07 — Regression output validation and blocking decisions. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type {
  ProtectionDecision,
  RegressionProtectionReport,
  RegressionRunValidationReport,
} from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { appendRegressionLog } from "./regression-logging.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";

export class RegressionValidator {
  private readonly metadata = new RegressionMetadataGenerator();

  validate(
    reports: RegressionProtectionReport[],
    config: RegressionProtectionConfiguration,
  ): RegressionRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled) {
      return this.buildReport("pass", reports, errors, warnings, started);
    }

    if (reports.length === 0) warnings.push("No regression reports produced");

    const allRegressions = reports.flatMap((r) => r.detectedRegressions);
    const critical = allRegressions.filter((r) => r.severity === "critical");
    const high = allRegressions.filter((r) => r.severity === "high");

    if (config.blockOnCriticalRegressions && critical.length > 0) {
      errors.push(`${critical.length} critical regression(s) detected — changes blocked`);
      appendRegressionLog({
        event: "blocking_decision",
        level: "warn",
        details: `Blocked due to ${critical.length} critical regressions`,
      });
    }
    if (config.blockOnHighRegressions && high.length > 0) {
      errors.push(`${high.length} high severity regression(s) detected — changes blocked`);
      appendRegressionLog({
        event: "blocking_decision",
        level: "warn",
        details: `Blocked due to ${high.length} high regressions`,
      });
    }

    let decision: ProtectionDecision = "pass";
    if (config.blockOnCriticalRegressions && critical.length > 0) {
      decision = "blocked";
    } else if (config.blockOnHighRegressions && high.length > 0) {
      decision = "blocked";
    } else if (allRegressions.length > 0) {
      decision = reports.some((r) => r.regressionStatus === "protected") ? "partial" : "fail";
    } else if (warnings.length > 0) {
      decision = "partial";
    }

    appendRegressionLog({
      event: "regression_decision",
      level: decision === "pass" ? "info" : "warn",
      details: `Decision ${decision.toUpperCase()} · ${allRegressions.length} regressions`,
    });

    return this.buildReport(decision, reports, errors, warnings, started);
  }

  private buildReport(
    decision: ProtectionDecision,
    reports: RegressionProtectionReport[],
    errors: string[],
    warnings: string[],
    started: number,
    scopesCovered = 0,
  ): RegressionRunValidationReport {
    const regressionsDetected = reports.reduce(
      (sum, r) => sum + r.detectedRegressions.length,
      0,
    );
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      reportsChecked: reports.length,
      regressionsDetected,
      scopesCovered,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: REGRESSION_METADATA_VERSION,
    };
  }
}
