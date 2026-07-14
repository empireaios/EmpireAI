/** T4-07 — Approval metadata and ID generation. */

import type { ApprovalRecord } from "./types.js";
import { APPROVAL_METADATA_VERSION } from "./paths.js";

export class ApprovalMetadataGenerator {
  buildApprovalId(): string {
    return `aw-apr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `aw-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `aw-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildPresentationId(): string {
    return `aw-pres-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `aw-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichApproval(record: ApprovalRecord): ApprovalRecord {
    return { ...record, metadataVersion: APPROVAL_METADATA_VERSION };
  }
}
