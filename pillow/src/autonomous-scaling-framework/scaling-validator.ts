/** X3-01 — Scaling module validator. */

import { ASF_METADATA_VERSION } from "./paths.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type {
  AutonomousScalingFrameworkRecord,
  ScalingModuleDefinition,
  ScalingValidationReport,
} from "./types.js";

/** Later Autonomous Scaling missions — out of scope for X3-01 unless approved mission id. */
export const RESERVED_SCALING_MODULES = [
  { id: "winning-product-detector", mission: "X3-02" },
  { id: "scaling-decision-engine", mission: "X3-03" },
  { id: "capacity-planning-engine", mission: "X3-04" },
  { id: "marketing-scale-engine", mission: "X3-05" },
  { id: "supplier-scale-engine", mission: "X3-06" },
  { id: "financial-scale-engine", mission: "X3-07" },
  { id: "workforce-intelligence", mission: "X3-08" },
  { id: "executive-scaling-dashboard", mission: "X3-09" },
  { id: "bottleneck-intelligence", mission: "X3-10" },
  { id: "operational-elasticity-engine", mission: "X3-11" },
  { id: "performance-preservation-engine", mission: "X3-12" },
  { id: "scaling-risk-monitor", mission: "X3-13" },
  { id: "global-scaling-planner", mission: "X3-14" },
  { id: "autonomous-growth-optimizer", mission: "X3-15" },
  { id: "revenue-acceleration-engine", mission: "X3-16" },
  { id: "profit-scaling-engine", mission: "X3-17" },
  { id: "scale-simulation-engine", mission: "X3-18" },
  { id: "self-balancing-enterprise", mission: "X3-19" },
  { id: "autonomous-scaling-certified", mission: "X3-20" },
  { id: "scaling-intelligence-certified", mission: "X3-21" },
  { id: "automation-expansion-engine", mission: "X3-22" },
  { id: "scaling-risk-engine", mission: "X3-23" },
  { id: "scaling-cost-optimizer", mission: "X3-25" },
  { id: "autonomous-scaling-dashboard", mission: "X3-26" },
  { id: "performance-bottleneck-analyzer", mission: "X3-27" },
  { id: "scaling-forecast-engine", mission: "X3-28" },
  { id: "self-healing-scaling-engine", mission: "X3-29" },
  { id: "expansion-readiness-validator", mission: "X3-30" },
  { id: "multi-region-deployment-engine", mission: "X3-31" },
  { id: "scaling-knowledge-engine", mission: "X3-32" },
  { id: "continuous-scaling-optimizer", mission: "X3-33" },
  { id: "autonomous-scaling-board", mission: "X3-34" },
];

export class ScalingValidator {
  validateDefinition(
    definition: ScalingModuleDefinition,
    config: AutonomousScalingFrameworkConfiguration,
  ): ScalingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
      !definition.scalingModuleIdentifier ||
      definition.scalingModuleIdentifier.trim().length === 0
    ) {
      errors.push("Missing scaling module identifier");
    }

    for (const reserved of RESERVED_SCALING_MODULES) {
      if (definition.scalingModuleIdentifier === reserved.id) {
        const approved = definition.integrationMissionId === reserved.mission;
        if (!approved) {
          errors.push(
            "Specific scaling integrations are out of scope for X3-01 — use template modules or approved integration missions",
          );
        }
      }
    }

    if (!definition.moduleVersion) errors.push("Missing module version");
    if (definition.supportedCapabilities.length === 0) {
      warnings.push("No supported capabilities declared");
    }
    if (!config.moduleRegistrationRulesEnabled) {
      warnings.push("Registration rules disabled by configuration");
    }
    if (!config.preserveModuleIsolation) {
      errors.push("Module isolation must remain enabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `asf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      scalingFrameworkId: null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ASF_METADATA_VERSION,
    };
  }

  validateRecord(record: AutonomousScalingFrameworkRecord): ScalingValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.scalingFrameworkId.startsWith("asf-")) {
      errors.push("Invalid scaling framework ID prefix");
    }
    if (!record.metadataVersion) errors.push("Missing metadata version");
    if (record.bypassedValidation) errors.push("Validation bypass is forbidden");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `asf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      scalingFrameworkId: record.scalingFrameworkId,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ASF_METADATA_VERSION,
    };
  }
}
