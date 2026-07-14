/** T5-05 — Workflow evolution record validation. */

import { randomUUID } from "node:crypto";
import { WORKFLOW_EVOLUTION_METADATA_VERSION } from "./paths.js";
import type { WorkflowEvolutionConfiguration } from "./configuration.js";
import type {
  WorkflowEvolutionRecord,
  WorkflowEvolutionValidationReport,
} from "./types.js";

export class WorkflowValidator {
  validate(
    records: WorkflowEvolutionRecord[],
    config: WorkflowEvolutionConfiguration,
  ): WorkflowEvolutionValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.workflowEvolutionId) errors.push("Missing workflow evolution ID");
      if (record.recommendOnly !== true) errors.push("Record must remain recommend-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Record ${record.workflowEvolutionId} confidence below threshold`);
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.workflowEvolutionId} lacks evidence references`);
      }
      if (!record.recommendedWorkflowImprovements.length) {
        warnings.push(`Record ${record.workflowEvolutionId} lacks recommendations`);
      }
    }

    if (!records.length) {
      warnings.push("No workflow evolution recommendations in this cycle");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: randomUUID(),
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: records.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WORKFLOW_EVOLUTION_METADATA_VERSION,
    };
  }
}
