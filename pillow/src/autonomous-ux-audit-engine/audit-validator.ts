/** T5-02 — UX audit record validation. */

import { randomUUID } from "node:crypto";
import { AUDIT_METADATA_VERSION } from "./paths.js";
import type { AutonomousUxAuditConfiguration } from "./configuration.js";
import type { AuditValidationReport, UxAuditRecord } from "./types.js";

export class AuditValidator {
  validate(
    audit: UxAuditRecord,
    config: AutonomousUxAuditConfiguration,
  ): AuditValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!audit.auditId) errors.push("Missing audit ID");
    if (audit.auditOnly !== true) errors.push("Audit must remain audit-only");
    if (audit.confidenceScore < config.confidenceThreshold) {
      warnings.push(
        `Confidence ${audit.confidenceScore.toFixed(2)} below threshold ${config.confidenceThreshold}`,
      );
    }
    if (config.evidenceRequirementsEnabled && audit.evidenceReferences.length === 0) {
      if (audit.detectedUxIssues.length > 0) {
        warnings.push("Issues detected without evidence references");
      }
    }
    if (!audit.sourceObservationId) {
      warnings.push("No source observation ID linked to this audit");
    }

    const decision =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass";

    return {
      validationReportId: randomUUID(),
      validationTimestamp: new Date().toISOString(),
      decision,
      auditsValidated: 1,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AUDIT_METADATA_VERSION,
    };
  }
}
