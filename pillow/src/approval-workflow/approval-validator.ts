/** T4-07 — Approval output validation. */

import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type {
  ApprovalRecord,
  ApprovalRunValidationReport,
  ValidationDecision,
} from "./types.js";
import { ApprovalMetadataGenerator } from "./approval-metadata-generator.js";
import { appendApprovalLog } from "./approval-logging.js";
import { APPROVAL_METADATA_VERSION } from "./paths.js";

export class ApprovalValidator {
  private readonly metadata = new ApprovalMetadataGenerator();

  validate(
    approval: ApprovalRecord | null,
    config: ApprovalWorkflowConfiguration,
    extras?: { autoApproved?: boolean; implementationAttempted?: boolean },
  ): ApprovalRunValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let actionsBlocked = 0;
    let actionsDispatched = 0;

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", approval, errors, warnings, started, 0, 0);
    }

    if (!approval) {
      errors.push("No approval record produced");
      return this.buildReport("fail", approval, errors, warnings, started, 0, 0);
    }

    if (!approval.approvalDecision) warnings.push("Missing approval decision");
    if (extras?.autoApproved) errors.push("Approval workflow must not approve automatically");
    if (extras?.implementationAttempted && approval.approvalStatus !== "approved") {
      errors.push("Unapproved changes must not proceed to implementation");
      actionsBlocked += 1;
    }

    if (approval.approvalStatus === "approved") actionsDispatched = 1;
    if (
      approval.approvalStatus === "rejected" ||
      approval.approvalStatus === "deferred" ||
      approval.approvalStatus === "changes_requested" ||
      approval.approvalStatus === "blocked"
    ) {
      actionsBlocked = 1;
    }

    if (
      config.confirmationRulesEnabled &&
      approval.approvalDecision === "approve" &&
      !approval.grandKingConfirmationRef
    ) {
      warnings.push("Approval recorded without explicit Grand King confirmation reference");
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendApprovalLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()}`,
    });

    return this.buildReport(
      decision,
      approval,
      errors,
      warnings,
      started,
      actionsBlocked,
      actionsDispatched,
    );
  }

  private buildReport(
    decision: ValidationDecision,
    approval: ApprovalRecord | null,
    errors: string[],
    warnings: string[],
    started: number,
    actionsBlocked: number,
    actionsDispatched: number,
  ): ApprovalRunValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      approvalsProcessed: approval ? 1 : 0,
      actionsBlocked,
      actionsDispatched,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: APPROVAL_METADATA_VERSION,
    };
  }
}
