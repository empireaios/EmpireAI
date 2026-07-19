/** R2-19 — Procurement intelligence validation and metadata. */

import type {
  InvalidProcurementIntelligenceFinding,
  ProcurementIntelligenceFailureFinding,
  ProcurementIntelligenceRecord,
  ProcurementIntelligenceValidationReport,
} from "./types.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import { PI_METADATA_VERSION } from "./paths.js";

export class ProcurementIntelligenceValidationEngine {
  detectInvalidProduct(productReference: string, confidenceScore: number): InvalidProcurementIntelligenceFinding | null {
    const errors: string[] = [];
    if (!productReference) errors.push("Missing product reference");
    if (confidenceScore < 0 || confidenceScore > 100) errors.push("Invalid confidence score");
    if (errors.length) return { productReference: productReference || "unknown", errors };
    return null;
  }

  validateIntelligenceRecords(
    records: ProcurementIntelligenceRecord[],
    config: ProcurementIntelligenceConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.procurementIntelligenceId)) {
        errors.push(`Duplicate intelligence record: ${record.procurementIntelligenceId}`);
      }
      seen.add(record.procurementIntelligenceId);
      if (!record.procurementIntelligenceId.startsWith("pi-")) {
        errors.push(`Invalid intelligence record ID prefix: ${record.procurementIntelligenceId}`);
      }
      if (record.recommendedPurchaseQuantity <= 0) {
        errors.push(`Invalid quantity for ${record.productReference}`);
      }
    }
    return { errors, warnings };
  }
}

export class ProcurementIntelligenceValidator {
  private readonly validationEngine = new ProcurementIntelligenceValidationEngine();

  validateIntelligenceResult(input: {
    records: ProcurementIntelligenceRecord[];
    failures: ProcurementIntelligenceFailureFinding[];
    config: ProcurementIntelligenceConfiguration;
    startedAt: number;
  }): ProcurementIntelligenceValidationReport {
    const { errors, warnings } = this.validationEngine.validateIntelligenceRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} analysis failure(s) detected`);

    let decision: ProcurementIntelligenceValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `pi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: PI_METADATA_VERSION,
    };
  }
}

export function buildIntelligenceReportId(): string {
  return `pi-run-${Date.now()}`;
}

export class ProcurementMetadataGenerator {
  generateIntelligenceReport(input: {
    action: import("./types.js").ProcurementIntelligenceReport["action"];
    records: ProcurementIntelligenceRecord[];
    anomalies: import("./types.js").ProcurementAnomalyFinding[];
    recommendations: import("./types.js").PurchasingRecommendation[];
    failures: ProcurementIntelligenceFailureFinding[];
    invalidRecords: InvalidProcurementIntelligenceFinding[];
    validation: ProcurementIntelligenceValidationReport;
    durationMs: number;
  }): import("./types.js").ProcurementIntelligenceReport {
    return {
      intelligenceReportId: buildIntelligenceReportId(),
      intelligenceTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      anomalies: input.anomalies,
      recommendations: input.recommendations,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PI_METADATA_VERSION,
    };
  }
}
