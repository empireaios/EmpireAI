/** T2-05 — Workflow metadata generation. */

import { WORKFLOW_METADATA_VERSION } from "./paths.js";
import type { WorkflowOptimizationRecord } from "./types.js";

export class WorkflowMetadataGenerator {
  buildOptimizationRecordId(): string {
    return `wfo-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildFrictionId(category: string): string {
    return `friction-${category}-${Math.random().toString(36).slice(2, 8)}`;
  }

  buildStrengthId(): string {
    return `strength-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  enrichRecord(record: WorkflowOptimizationRecord): WorkflowOptimizationRecord {
    return { ...record, metadataVersion: WORKFLOW_METADATA_VERSION };
  }

  validateRecord(record: WorkflowOptimizationRecord): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.optimizationRecordId) errors.push("Missing optimizationRecordId");
    if (!record.metadataVersion) errors.push("Missing metadataVersion");
    return { valid: errors.length === 0, errors };
  }
}
