/** T5-08 — Workspace intelligence record validation. */

import { randomUUID } from "node:crypto";
import { WORKSPACE_INTELLIGENCE_METADATA_VERSION } from "./paths.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import type { WorkspaceIntelligenceRecord, WorkspaceValidationReport } from "./types.js";

export class WorkspaceValidator {
  validate(
    records: WorkspaceIntelligenceRecord[],
    config: ExecutiveWorkspaceIntelligenceConfiguration,
  ): WorkspaceValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (!record.workspaceIntelligenceId) errors.push("Missing workspace intelligence ID");
      if (record.recommendOnly !== true) errors.push("Record must remain recommend-only");
      if (record.confidenceScore < config.confidenceThreshold) {
        warnings.push(`Record ${record.workspaceIntelligenceId} confidence below threshold`);
      }
      if (!record.evidenceReferences.length) {
        warnings.push(`Record ${record.workspaceIntelligenceId} lacks evidence references`);
      }
      if (!record.recommendedDashboardLayout.length) {
        warnings.push(`Record ${record.workspaceIntelligenceId} lacks dashboard layout`);
      }
      if (!record.recommendedWidgets.length) {
        warnings.push(`Record ${record.workspaceIntelligenceId} lacks widget recommendations`);
      }
    }

    if (!records.length) {
      warnings.push("No workspace intelligence recommendations in this cycle");
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
      metadataVersion: WORKSPACE_INTELLIGENCE_METADATA_VERSION,
    };
  }
}
