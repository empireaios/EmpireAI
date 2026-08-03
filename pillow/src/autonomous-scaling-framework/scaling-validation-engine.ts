/** X3-01 — Scaling validation engine. */

import { ASF_METADATA_VERSION } from "./paths.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type {
  AutonomousScalingFrameworkRecord,
  ScalingModuleDefinition,
  ScalingValidationReport,
} from "./types.js";
import { ScalingValidator } from "./scaling-validator.js";

export class ScalingValidationEngine {
  private readonly validator = new ScalingValidator();

  validateRegistration(
    definition: ScalingModuleDefinition,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingValidationReport {
    const report = this.validator.validateDefinition(definition, config);
    if (!config.validationRulesEnabled) {
      return {
        ...report,
        decision: "pass",
        warnings: [...report.warnings, "Validation rules disabled by configuration"],
      };
    }
    return report;
  }

  validateRecord(
    record: AutonomousScalingFrameworkRecord,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingValidationReport {
    const report = this.validator.validateRecord(record);
    if (!config.validationRulesEnabled) {
      return { ...report, decision: "pass" };
    }
    if (record.validationStatus === "fail") {
      report.decision = "fail";
      report.errors.push("Record validation status is fail");
    }
    return report;
  }

  validateEventRouting(
    record: AutonomousScalingFrameworkRecord | null,
    topic: string,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record) errors.push("Scaling module not registered");
    else if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      errors.push(`Module not routable in state: ${record.operationalState}`);
    }
    if (!topic) errors.push("Missing event topic");
    if (!config.eventRoutingRulesEnabled) {
      warnings.push("Event routing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `asf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      scalingFrameworkId: record?.scalingFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ASF_METADATA_VERSION,
    };
  }
}
