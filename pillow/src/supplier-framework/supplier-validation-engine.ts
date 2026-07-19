/** R2-01 — Supplier validation engine. */

import { SUPPLIER_METADATA_VERSION } from "./paths.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  SupplierConnectorDefinition,
  SupplierFrameworkRecord,
  SupplierValidationReport,
} from "./types.js";
import { SupplierValidator } from "./supplier-validator.js";

export class SupplierValidationEngine {
  private readonly validator = new SupplierValidator();

  validateRegistration(
    definition: SupplierConnectorDefinition,
    config: SupplierFrameworkConfiguration,
  ): SupplierValidationReport {
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
    record: SupplierFrameworkRecord,
    config: SupplierFrameworkConfiguration,
  ): SupplierValidationReport {
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
    record: SupplierFrameworkRecord | null,
    topic: string,
    config: SupplierFrameworkConfiguration,
  ): SupplierValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record) errors.push("Supplier connector not registered");
    else if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      errors.push(`Supplier not routable in state: ${record.operationalState}`);
    }
    if (!topic) errors.push("Missing event topic");
    if (!config.eventRoutingRulesEnabled) {
      warnings.push("Event routing rules disabled");
    }

    const decision = errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: `sf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      frameworkId: record?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SUPPLIER_METADATA_VERSION,
    };
  }
}
