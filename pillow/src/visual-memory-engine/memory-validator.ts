/** T1-08 — Visual memory record validation. */

import { appendMemoryLog } from "./memory-logging.js";
import type { VisualMemoryRecord } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class MemoryValidator {
  validate(record: VisualMemoryRecord): ValidationResult {
    const errors: string[] = [];

    if (!record.memoryRecordId) errors.push("Missing memoryRecordId");
    if (!record.sessionId) errors.push("Missing sessionId");
    if (!record.timestamp) errors.push("Missing timestamp");
    if (!record.sourceUiStateId) errors.push("Missing sourceUiStateId");
    if (!record.stateSummary) errors.push("Missing stateSummary");
    if (!record.storageLocation) errors.push("Missing storageLocation");
    if (!record.retentionCategory) errors.push("Missing retentionCategory");
    if (record.confidence < 0 || record.confidence > 1) errors.push("Confidence out of range");

    const valid = errors.length === 0;
    appendMemoryLog({
      event: "memory_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Record ${record.memoryRecordId} validated`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
