/** R2-14 — Warehouse validation and metadata. */

import type {
  InvalidWarehouseFinding,
  WarehouseFailureFinding,
  WarehouseRecord,
  WarehouseValidationReport,
} from "./types.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import { WI_METADATA_VERSION } from "./paths.js";

export class WarehouseValidationEngine {
  detectInvalidWarehouse(warehouseId: string, inventoryLevel: number): InvalidWarehouseFinding | null {
    const errors: string[] = [];
    if (!warehouseId) errors.push("Missing warehouse ID");
    if (inventoryLevel < 0) errors.push("Invalid inventory level");
    if (errors.length) return { warehouseId: warehouseId || "unknown", errors };
    return null;
  }

  validateWarehouseRecords(
    records: WarehouseRecord[],
    config: WarehouseIntelligenceConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.warehouseRecordId)) {
        errors.push(`Duplicate warehouse record: ${record.warehouseRecordId}`);
      }
      seen.add(record.warehouseRecordId);
      if (!record.warehouseRecordId.startsWith("wi-")) {
        errors.push(`Invalid warehouse record ID prefix: ${record.warehouseRecordId}`);
      }
    }
    return { errors, warnings };
  }
}

export class WarehouseValidator {
  private readonly validationEngine = new WarehouseValidationEngine();

  validateWarehouseResult(input: {
    records: WarehouseRecord[];
    failures: WarehouseFailureFinding[];
    config: WarehouseIntelligenceConfiguration;
    startedAt: number;
  }): WarehouseValidationReport {
    const { errors, warnings } = this.validationEngine.validateWarehouseRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} warehouse failure(s) detected`);

    let decision: WarehouseValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `wi-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: WI_METADATA_VERSION,
    };
  }
}

export function buildWarehouseReportId(): string {
  return `wi-run-${Date.now()}`;
}

export class WarehouseMetadataGenerator {
  generateWarehouseReport(input: {
    action: import("./types.js").WarehouseReport["action"];
    records: WarehouseRecord[];
    failures: WarehouseFailureFinding[];
    invalidRecords: InvalidWarehouseFinding[];
    validation: WarehouseValidationReport;
    durationMs: number;
  }): import("./types.js").WarehouseReport {
    return {
      warehouseReportId: buildWarehouseReportId(),
      warehouseTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WI_METADATA_VERSION,
    };
  }
}
