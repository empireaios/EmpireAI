/** T2-08 — Score metadata generation. */

import { SCORING_METADATA_VERSION } from "./paths.js";
import type { UxScoreRecord } from "./types.js";

export class ScoreMetadataGenerator {
  buildScoreId(): string {
    return `uxs-score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enrichRecord(record: UxScoreRecord): UxScoreRecord {
    return { ...record, metadataVersion: SCORING_METADATA_VERSION };
  }

  validateRecord(record: UxScoreRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.uxScoreId) errors.push("Missing uxScoreId");
    if (!record.metadataVersion) errors.push("Missing metadataVersion");
    if (record.overallUxScore < 0 || record.overallUxScore > 100) {
      errors.push("Overall UX score out of range");
    }
    return { valid: errors.length === 0, errors };
  }
}
