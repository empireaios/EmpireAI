/** T4-06 — Explanation metadata and ID generation. */

import type { ExplanationRecord } from "./types.js";
import { EXPLANATION_METADATA_VERSION } from "./paths.js";

export class ExplanationMetadataGenerator {
  buildExplanationId(): string {
    return `ed-exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildSessionId(): string {
    return `ed-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildRunReportId(): string {
    return `ed-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildValidationId(): string {
    return `ed-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildEvidenceId(): string {
    return `ed-evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichExplanation(record: ExplanationRecord): ExplanationRecord {
    return { ...record, metadataVersion: EXPLANATION_METADATA_VERSION };
  }
}
