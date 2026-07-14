/** T3-09 — Change metadata and ID generation. */

import type { ChangeDocumentationRecord } from "./types.js";
import { CHANGE_METADATA_VERSION } from "./paths.js";

export class ChangeMetadataGenerator {
  buildRecordId(): string {
    return `cd-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `cd-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `cd-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: ChangeDocumentationRecord): ChangeDocumentationRecord {
    return { ...record, metadataVersion: CHANGE_METADATA_VERSION };
  }
}
