/** T3-05 — Preview metadata and ID generation. */

import type { PreviewBuildRecord } from "./types.js";
import { PREVIEW_METADATA_VERSION } from "./paths.js";

export class PreviewMetadataGenerator {
  buildRecordId(): string {
    return `pg-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildReportId(): string {
    return `pg-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `pg-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildEnvironmentId(): string {
    return `pg-env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: PreviewBuildRecord): PreviewBuildRecord {
    return { ...record, metadataVersion: PREVIEW_METADATA_VERSION };
  }
}
