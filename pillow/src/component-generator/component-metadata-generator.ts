/** T3-02 — Component metadata generation. */

import { GENERATION_METADATA_VERSION } from "./paths.js";
import type { ComponentGenerationRecord } from "./types.js";

export class ComponentMetadataGenerator {
  buildRecordId(): string {
    return `cg-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildReportId(): string {
    return `cg-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: ComponentGenerationRecord): ComponentGenerationRecord {
    return { ...record, metadataVersion: GENERATION_METADATA_VERSION };
  }
}
