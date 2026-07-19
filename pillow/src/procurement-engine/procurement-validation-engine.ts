/** R2-09 — Procurement Validation Engine. */

import type { CreateProcurementRequestInput, InvalidProcurementFinding, ProcurementRecord } from "./types.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";

export class ProcurementValidationEngine {
  detectInvalidRequest(input: CreateProcurementRequestInput): InvalidProcurementFinding | null {
    const productRef = input.productReference ?? input.supplierProductId ?? "";
    const errors: string[] = [];

    if (!productRef) errors.push("Missing product reference");
    if (!input.requestedQuantity || input.requestedQuantity <= 0) {
      errors.push("Requested quantity must be a positive number");
    }

    if (errors.length) {
      return { productReference: productRef || "unknown", errors };
    }
    return null;
  }

  validateProcurementRecords(
    records: ProcurementRecord[],
    config: ProcurementEngineConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return { errors, warnings };
    }

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.procurementId)) {
        errors.push(`Duplicate procurement ID: ${record.procurementId}`);
      }
      seen.add(record.procurementId);

      if (!record.procurementId.startsWith("pce-")) {
        errors.push(`Invalid procurement ID prefix: ${record.procurementId}`);
      }
      if (record.requestedQuantity <= 0) {
        errors.push(`Invalid quantity for ${record.procurementId}`);
      }
      if (record.approvalStatus === "rejected" && record.procurementStatus !== "failed") {
        warnings.push(`Rejected procurement ${record.procurementId} has unexpected status`);
      }
    }

    return { errors, warnings };
  }
}
