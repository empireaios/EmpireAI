/** T3-03 — Layout refactoring metadata and ID generation. */

import type { LayoutRefactoringRecord } from "./types.js";
import { REFACTORING_METADATA_VERSION } from "./paths.js";

export class LayoutMetadataGenerator {
  buildRecordId(): string {
    return `lr-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildReportId(): string {
    return `lr-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `lr-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: LayoutRefactoringRecord): LayoutRefactoringRecord {
    return {
      ...record,
      metadataVersion: REFACTORING_METADATA_VERSION,
    };
  }
}
