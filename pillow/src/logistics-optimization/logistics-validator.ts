/** R2-17 — Logistics validation and metadata. */

import type {
  InvalidLogisticsFinding,
  LogisticsFailureFinding,
  LogisticsRecord,
  LogisticsValidationReport,
} from "./types.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import { LO_METADATA_VERSION } from "./paths.js";

export class LogisticsValidationEngine {
  detectInvalidOrder(orderReference: string, optimizationScore: number): InvalidLogisticsFinding | null {
    const errors: string[] = [];
    if (!orderReference) errors.push("Missing order reference");
    if (optimizationScore < 0 || optimizationScore > 100) errors.push("Invalid optimization score");
    if (errors.length) return { orderReference: orderReference || "unknown", errors };
    return null;
  }

  validateLogisticsRecords(
    records: LogisticsRecord[],
    config: LogisticsOptimizationConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.logisticsRecordId)) {
        errors.push(`Duplicate logistics record: ${record.logisticsRecordId}`);
      }
      seen.add(record.logisticsRecordId);
      if (!record.logisticsRecordId.startsWith("lo-")) {
        errors.push(`Invalid logistics record ID prefix: ${record.logisticsRecordId}`);
      }
      if (record.estimatedShippingCost < 0) {
        errors.push(`Negative shipping cost for ${record.orderReference}`);
      }
    }
    return { errors, warnings };
  }
}

export class LogisticsValidator {
  private readonly validationEngine = new LogisticsValidationEngine();

  validateOptimizationResult(input: {
    records: LogisticsRecord[];
    failures: LogisticsFailureFinding[];
    config: LogisticsOptimizationConfiguration;
    startedAt: number;
  }): LogisticsValidationReport {
    const { errors, warnings } = this.validationEngine.validateLogisticsRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} optimization failure(s) detected`);

    let decision: LogisticsValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `lo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: LO_METADATA_VERSION,
    };
  }
}

export function buildLogisticsReportId(): string {
  return `lo-run-${Date.now()}`;
}

export class LogisticsMetadataGenerator {
  generateLogisticsReport(input: {
    action: import("./types.js").LogisticsReport["action"];
    records: LogisticsRecord[];
    bottlenecks: import("./types.js").LogisticsBottleneckFinding[];
    recommendations: import("./types.js").LogisticsImprovementRecommendation[];
    failures: LogisticsFailureFinding[];
    invalidRecords: InvalidLogisticsFinding[];
    validation: LogisticsValidationReport;
    durationMs: number;
  }): import("./types.js").LogisticsReport {
    return {
      logisticsReportId: buildLogisticsReportId(),
      logisticsTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      bottlenecks: input.bottlenecks,
      recommendations: input.recommendations,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LO_METADATA_VERSION,
    };
  }
}
