/** T3-06 — Validation metadata and ID generation. */

import type { UiDefect, UiValidationReport } from "./types.js";
import { VALIDATION_METADATA_VERSION } from "./paths.js";

export class ValidationMetadataGenerator {
  buildReportId(): string {
    return `ve-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `ve-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildDefectId(): string {
    return `ve-defect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `ve-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichDefect(defect: UiDefect): UiDefect {
    return { ...defect, metadataVersion: VALIDATION_METADATA_VERSION };
  }

  enrichReport(report: UiValidationReport): UiValidationReport {
    return { ...report, metadataVersion: VALIDATION_METADATA_VERSION };
  }
}
