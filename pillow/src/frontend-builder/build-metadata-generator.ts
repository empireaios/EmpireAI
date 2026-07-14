/** T3-01 — Build metadata generation. */

import { BUILD_METADATA_VERSION } from "./paths.js";
import type { FrontendBuildRecord } from "./types.js";

export class BuildMetadataGenerator {
  buildRecordId(): string {
    return `fb-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildReportId(): string {
    return `fb-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildChangeId(scope: string): string {
    return `fb-change-${scope}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: FrontendBuildRecord): FrontendBuildRecord {
    return { ...record, metadataVersion: BUILD_METADATA_VERSION };
  }
}
