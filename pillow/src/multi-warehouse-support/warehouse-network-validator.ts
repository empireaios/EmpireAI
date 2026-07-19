/** R2-15 — Warehouse network validation and metadata. */

import type {
  InvalidWarehouseNetworkFinding,
  WarehouseNetworkFailureFinding,
  WarehouseNetworkRecord,
  WarehouseNetworkValidationReport,
} from "./types.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import { MWS_METADATA_VERSION } from "./paths.js";

export class WarehouseNetworkValidationEngine {
  detectInvalidWarehouse(warehouseId: string, inventoryAllocation: number): InvalidWarehouseNetworkFinding | null {
    const errors: string[] = [];
    if (!warehouseId) errors.push("Missing warehouse ID");
    if (inventoryAllocation < 0) errors.push("Invalid inventory allocation");
    if (errors.length) return { warehouseId: warehouseId || "unknown", errors };
    return null;
  }

  validateNetworkRecords(
    records: WarehouseNetworkRecord[],
    config: MultiWarehouseSupportConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.warehouseNetworkId)) {
        errors.push(`Duplicate network record: ${record.warehouseNetworkId}`);
      }
      seen.add(record.warehouseNetworkId);
      if (!record.warehouseNetworkId.startsWith("mws-")) {
        errors.push(`Invalid network record ID prefix: ${record.warehouseNetworkId}`);
      }
    }
    return { errors, warnings };
  }
}

export class WarehouseNetworkValidator {
  private readonly validationEngine = new WarehouseNetworkValidationEngine();

  validateNetworkResult(input: {
    records: WarehouseNetworkRecord[];
    failures: WarehouseNetworkFailureFinding[];
    config: MultiWarehouseSupportConfiguration;
    startedAt: number;
  }): WarehouseNetworkValidationReport {
    const { errors, warnings } = this.validationEngine.validateNetworkRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} network failure(s) detected`);

    let decision: WarehouseNetworkValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `mws-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: MWS_METADATA_VERSION,
    };
  }
}

export function buildNetworkReportId(): string {
  return `mws-run-${Date.now()}`;
}

export class WarehouseNetworkMetadataGenerator {
  generateNetworkReport(input: {
    action: import("./types.js").WarehouseNetworkReport["action"];
    records: WarehouseNetworkRecord[];
    failures: WarehouseNetworkFailureFinding[];
    invalidRecords: InvalidWarehouseNetworkFinding[];
    validation: WarehouseNetworkValidationReport;
    durationMs: number;
  }): import("./types.js").WarehouseNetworkReport {
    return {
      networkReportId: buildNetworkReportId(),
      networkTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: MWS_METADATA_VERSION,
    };
  }
}
