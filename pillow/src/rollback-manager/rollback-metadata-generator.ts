/** T3-08 — Rollback metadata and ID generation. */

import type { RestorePoint, RollbackReport } from "./types.js";
import { ROLLBACK_METADATA_VERSION } from "./paths.js";

export class RollbackMetadataGenerator {
  buildReportId(): string {
    return `rm-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `rm-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRestorePointId(): string {
    return `rm-restore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSnapshotId(): string {
    return `rm-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `rm-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildKnownGoodStateId(): string {
    return `rm-known-good-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRestorePoint(point: RestorePoint): RestorePoint {
    return { ...point, metadataVersion: ROLLBACK_METADATA_VERSION };
  }

  enrichReport(report: RollbackReport): RollbackReport {
    return { ...report, metadataVersion: ROLLBACK_METADATA_VERSION };
  }
}
