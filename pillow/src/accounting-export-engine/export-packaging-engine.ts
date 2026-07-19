/** R3-17 — Export packaging engine. */

import { createHash } from "node:crypto";
import { AEE_METADATA_VERSION } from "./paths.js";
import type { ExportFormat, ExportPackage, ExportRecord } from "./types.js";

export function buildExportPackageId(): string {
  return `aee-pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ExportPackagingEngine {
  packageExport(
    record: ExportRecord,
    content: string,
    exportFormat?: ExportFormat,
  ): ExportPackage {
    const checksum = createHash("sha256").update(content).digest("hex").slice(0, 16);
    return {
      packageId: buildExportPackageId(),
      exportRecordId: record.exportRecordId,
      exportFormat: exportFormat ?? record.exportFormat,
      content,
      checksum,
      recordCount: record.recordCount,
      timestamp: new Date().toISOString(),
      metadataVersion: AEE_METADATA_VERSION,
    };
  }
}
