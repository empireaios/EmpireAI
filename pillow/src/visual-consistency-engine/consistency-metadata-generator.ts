/** T2-07 — Consistency metadata generation. */

import { CONSISTENCY_METADATA_VERSION } from "./paths.js";
import type { ConsistencyFinding, ConsistencyReviewRecord } from "./types.js";

export class ConsistencyMetadataGenerator {
  buildReviewId(): string {
    return `vce-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildFindingId(category: string): string {
    return `vce-${category}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildStrengthId(): string {
    return `vce-strength-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichFinding(finding: ConsistencyFinding): ConsistencyFinding {
    return { ...finding, metadataVersion: CONSISTENCY_METADATA_VERSION };
  }

  enrichRecord(record: ConsistencyReviewRecord): ConsistencyReviewRecord {
    return { ...record, metadataVersion: CONSISTENCY_METADATA_VERSION };
  }

  validateRecord(record: ConsistencyReviewRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.consistencyReviewId) errors.push("Missing consistencyReviewId");
    if (!record.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }
}
