/** R3-18 — Certification validator. */

import { CERTIFICATION_SCHEMA_VERSION, FOC_METADATA_VERSION } from "./paths.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationValidationReport,
  MissionValidationResult,
  FinancialOperationsCertificationReport,
} from "./types.js";

export class CertificationValidator {
  validateCertificationResult(input: {
    missionResults: MissionValidationResult[];
    config: FinancialOperationsCertificationConfiguration;
  }): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.config.requiredValidationRulesEnabled) {
      return {
        validationReportId: `foc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "pass",
        errors: [],
        warnings: ["Required validation rules disabled"],
        durationMs: Date.now() - started,
        metadataVersion: FOC_METADATA_VERSION,
      };
    }

    for (const result of input.missionResults) {
      if (result.status === "fail") {
        errors.push(`${result.missionId}: ${result.errors.join("; ") || "validation failed"}`);
      } else if (result.status === "partial") {
        warnings.push(`${result.missionId}: ${result.warnings.join("; ") || "partial pass"}`);
      }
    }

    const passed = input.missionResults.filter((r) => r.status === "pass").length;
    const passPercent =
      input.missionResults.length > 0
        ? Math.round((passed / input.missionResults.length) * 100)
        : 0;

    if (passPercent < input.config.passThresholdPercent) {
      warnings.push(
        `Pass rate ${passPercent}% below threshold ${input.config.passThresholdPercent}%`,
      );
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `foc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FOC_METADATA_VERSION,
    };
  }

  validateReportIntegrity(
    report: FinancialOperationsCertificationReport,
  ): CertificationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!report.certificationId.startsWith("foc-run-")) {
      errors.push("Invalid certification ID prefix");
    }
    if (report.schemaVersion !== CERTIFICATION_SCHEMA_VERSION) {
      errors.push("Schema version mismatch");
    }
    if (report.metadataVersion !== FOC_METADATA_VERSION) {
      warnings.push("Metadata version mismatch");
    }
    if (report.missionResults.length !== report.certifiedMissionList.length) {
      warnings.push("Mission result count differs from certified mission list");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `foc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FOC_METADATA_VERSION,
    };
  }
}
