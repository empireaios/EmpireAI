/** X4-01 — Scaling validation engine. */

import { GEF_METADATA_VERSION } from "./paths.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  GlobalExpansionFrameworkRecord,
  ExpansionModuleDefinition,
  ExpansionValidationReport,
} from "./types.js";
import { GlobalValidator } from "./global-validator.js";

export class GlobalValidationEngine {
  private readonly validator = new GlobalValidator();

  validateRegistration(
    definition: ExpansionModuleDefinition,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionValidationReport {
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
    record: GlobalExpansionFrameworkRecord,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionValidationReport {
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
    record: GlobalExpansionFrameworkRecord | null,
    topic: string,
    config: GlobalExpansionFrameworkConfiguration,
  ): ExpansionValidationReport {
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
      validationReportId: `gef-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      expansionFrameworkId: record?.expansionFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: GEF_METADATA_VERSION,
    };
  }
}
