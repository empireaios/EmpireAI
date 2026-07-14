/** T2-05 — Workflow optimization validation. */

import { WORKFLOW_METADATA_VERSION } from "./paths.js";
import type {
  ValidationDecision,
  WorkflowOptimizationRecord,
  WorkflowOptimizationValidationReport,
} from "./types.js";

export class WorkflowValidator {
  validate(
    record: WorkflowOptimizationRecord,
    enabled: boolean,
  ): WorkflowOptimizationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enabled) {
      return this.report("pass", record, errors, warnings, started);
    }

    if (!record.optimizationRecordId) errors.push("Optimization record missing ID");
    if (!record.sourceWorkflowContextId && record.sourceInteractionEventIds.length === 0) {
      warnings.push("No workflow context or interaction events — partial analysis");
    }
    if (record.detectedFrictionPoints.length === 0 && record.detectedWorkflowStrengths.length === 0) {
      warnings.push("No friction points or strengths detected");
    }
    if (record.severity === "error") {
      warnings.push("High-severity workflow friction detected");
    }
    if (record.confidenceScore < 30) {
      warnings.push(`Low analysis confidence: ${record.confidenceScore}`);
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    return this.report(decision, record, errors, warnings, started);
  }

  private report(
    decision: ValidationDecision,
    record: WorkflowOptimizationRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkflowOptimizationValidationReport {
    return {
      validationReportId: `wfo-validation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      recordsValidated: 1,
      frictionPointsDetected: record.detectedFrictionPoints.length,
      strengthsIdentified: record.detectedWorkflowStrengths.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WORKFLOW_METADATA_VERSION,
    };
  }
}
