/** T4-09 — Continuous collaboration output validation. */

import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import type {
  CollaborationSessionRecord,
  CollaborationValidationReport,
  ValidationDecision,
} from "./types.js";
import { CollaborationMetadataGenerator } from "./collaboration-metadata-generator.js";
import { appendCollaborationLog } from "./collaboration-logging.js";
import { COLLABORATION_METADATA_VERSION } from "./paths.js";

export class CollaborationValidator {
  private readonly metadata = new CollaborationMetadataGenerator();

  validate(
    session: CollaborationSessionRecord,
    config: ContinuousCollaborationConfiguration,
    extras?: { autoApproved?: boolean; autoExecuted?: boolean },
  ): CollaborationValidationReport {
    const started = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.outputValidationEnabled || !config.validationRulesEnabled) {
      return this.buildReport("pass", session, errors, warnings, started);
    }

    if (!session.collaborationContextSummary) {
      warnings.push("Collaboration context summary is empty");
    }

    for (const pref of session.appliedCollaborationPreferences) {
      if (!pref.explicitOverrideAllowed) {
        warnings.push(`Preference ${pref.preferenceId} should allow explicit override`);
      }
    }

    if (extras?.autoApproved) {
      errors.push("Continuous collaboration must not approve UX changes automatically");
    }
    if (extras?.autoExecuted) {
      errors.push("Continuous collaboration must not execute UX changes automatically");
    }

    let decision: ValidationDecision = "pass";
    if (errors.length > 0) decision = "fail";
    else if (warnings.length > 0) decision = "partial";

    appendCollaborationLog({
      event: "validation_results",
      level: decision === "pass" ? "info" : "warn",
      details: `Validation ${decision.toUpperCase()} · session ${session.collaborationSessionId}`,
    });

    return this.buildReport(decision, session, errors, warnings, started);
  }

  private buildReport(
    decision: ValidationDecision,
    session: CollaborationSessionRecord,
    errors: string[],
    warnings: string[],
    started: number,
  ): CollaborationValidationReport {
    return {
      validationReportId: this.metadata.buildValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      sessionsSynchronized: 1,
      discussionsTracked: session.activeDiscussionTopics.length,
      proposalsTracked: session.pendingProposalIds.length,
      approvalsTracked: session.pendingApprovalIds.length,
      preferencesApplied: session.appliedCollaborationPreferences.length,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COLLABORATION_METADATA_VERSION,
    };
  }
}
