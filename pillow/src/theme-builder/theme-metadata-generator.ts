/** T3-04 — Theme metadata and ID generation. */

import type { ThemeRecord } from "./types.js";
import { THEME_METADATA_VERSION } from "./paths.js";

export class ThemeMetadataGenerator {
  buildRecordId(): string {
    return `tb-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildReportId(): string {
    return `tb-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `tb-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: ThemeRecord): ThemeRecord {
    return { ...record, metadataVersion: THEME_METADATA_VERSION };
  }
}
