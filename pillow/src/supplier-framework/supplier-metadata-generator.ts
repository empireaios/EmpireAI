/** R2-01 — Supplier metadata generator. */

import { SUPPLIER_METADATA_VERSION } from "./paths.js";
import type {
  FrameworkRunReport,
  SupplierFrameworkRecord,
  SupplierValidationReport,
} from "./types.js";

export function buildFrameworkId(supplierIdentifier: string): string {
  return `sf-${supplierIdentifier}-${Date.now()}`;
}

export function buildFrameworkRunReportId(): string {
  return `sf-run-${Date.now()}`;
}

export class SupplierMetadataGenerator {
  buildRunReport(input: {
    action: FrameworkRunReport["action"];
    records: SupplierFrameworkRecord[];
    validation: SupplierValidationReport;
    durationMs: number;
  }): FrameworkRunReport {
    for (const record of input.records) {
      record.validationStatus =
        input.validation.decision === "fail"
          ? "fail"
          : input.validation.decision === "partial"
            ? "partial"
            : "pass";
    }

    return {
      frameworkRunReportId: buildFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SUPPLIER_METADATA_VERSION,
    };
  }
}
