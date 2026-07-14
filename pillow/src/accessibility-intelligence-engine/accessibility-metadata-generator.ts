/** T2-06 — Accessibility metadata generation. */

import { ACCESSIBILITY_METADATA_VERSION } from "./paths.js";
import type { AccessibilityFinding, AccessibilityReviewRecord } from "./types.js";

export class AccessibilityMetadataGenerator {
  buildReviewId(): string {
    return `aii-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildFindingId(category: string): string {
    return `a11y-${category}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildStrengthId(): string {
    return `a11y-strength-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichFinding(finding: AccessibilityFinding): AccessibilityFinding {
    return { ...finding, metadataVersion: ACCESSIBILITY_METADATA_VERSION };
  }

  enrichRecord(record: AccessibilityReviewRecord): AccessibilityReviewRecord {
    return { ...record, metadataVersion: ACCESSIBILITY_METADATA_VERSION };
  }

  validateRecord(record: AccessibilityReviewRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.accessibilityReviewId) errors.push("Missing accessibilityReviewId");
    if (!record.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }
}
