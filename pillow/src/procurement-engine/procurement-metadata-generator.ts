/** R2-09 — Procurement Metadata Generator. */

import type { ProcurementReport } from "./types.js";
import { PCE_METADATA_VERSION } from "./paths.js";

export function buildProcurementReportId(): string {
  return `pce-run-${Date.now()}`;
}

export class ProcurementMetadataGenerator {
  generateProcurementReport(input: {
    action: ProcurementReport["action"];
    records: ProcurementReport["records"];
    selection: ProcurementReport["selection"];
    purchaseOrder: ProcurementReport["purchaseOrder"];
    failures: ProcurementReport["failures"];
    invalidRequests: ProcurementReport["invalidRequests"];
    validation: ProcurementReport["validation"];
    durationMs: number;
  }): ProcurementReport {
    return {
      procurementReportId: buildProcurementReportId(),
      procurementTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      selection: input.selection,
      purchaseOrder: input.purchaseOrder,
      failures: input.failures,
      invalidRequests: input.invalidRequests,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PCE_METADATA_VERSION,
    };
  }
}
