/** T4-08 — Learns preferences from T4-07 approval records. */

import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord, ExplicitEvidenceReference } from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class ApprovalLearningEngine {
  private readonly metadata = new PreferenceMetadataGenerator();

  learn(input: {
    config: PreferenceLearningConfiguration;
    approvalWorkflow: ApprovalWorkflowEngine | null;
    version: string;
  }): CollaborationPreferenceRecord[] {
    appendPreferenceLog({
      event: "approval_learning",
      level: "info",
      details: "Learning from approval records",
    });

    if (!input.approvalWorkflow) return [];

    const report = input.approvalWorkflow.getLatestReport?.() ?? null;
    const approval = report?.approval ?? null;
    if (!approval) return [];

    const evidence: ExplicitEvidenceReference[] = [
      {
        evidenceId: this.metadata.buildEvidenceId(),
        evidenceType: "approval_decision",
        sourceId: approval.approvalId,
        summary: `Grand King decision: ${approval.approvalDecision}`,
        strength: "explicit",
      },
    ];
    if (approval.grandKingConfirmationRef) {
      evidence.push({
        evidenceId: this.metadata.buildEvidenceId(),
        evidenceType: "grand_king_confirmation",
        sourceId: approval.grandKingConfirmationRef,
        summary: "Explicit Grand King confirmation reference",
        strength: "explicit",
      });
    }

    const preferences: CollaborationPreferenceRecord[] = [];

    preferences.push(
      this.buildPref({
        category: "approval_workflow",
        description: `Prefers ${approval.approvalDecision} decisions in approval workflow`,
        summary: `Approval behavior: ${approval.approvalDecision} with status ${approval.approvalStatus}`,
        confidence: approval.confidenceScore,
        version: input.version,
        sourceApprovalIds: [approval.approvalId],
        sourceProposalIds: approval.sourceProposalIds,
        sourceExplanationIds: approval.sourceExplanationId ? [approval.sourceExplanationId] : [],
        evidence,
      }),
    );

    if (approval.approvalDecision === "request_changes") {
      preferences.push(
        this.buildPref({
          category: "decision_style",
          description: "Grand King requests specific changes before approval",
          summary: approval.requestedChanges ?? "Requests detailed revisions",
          confidence: 0.75,
          version: input.version,
          sourceApprovalIds: [approval.approvalId],
          sourceProposalIds: approval.sourceProposalIds,
          sourceExplanationIds: [],
          evidence,
        }),
      );
    }

    if (approval.approvalDecision === "defer") {
      preferences.push(
        this.buildPref({
          category: "review_workflow",
          description: "Grand King defers decisions for later review",
          summary: "Prefers deferred review before committing to UX changes",
          confidence: 0.7,
          version: input.version,
          sourceApprovalIds: [approval.approvalId],
          sourceProposalIds: approval.sourceProposalIds,
          sourceExplanationIds: [],
          evidence,
        }),
      );
    }

    return preferences;
  }

  private buildPref(input: {
    category: CollaborationPreferenceRecord["preferenceCategory"];
    description: string;
    summary: string;
    confidence: number;
    version: string;
    sourceApprovalIds: string[];
    sourceProposalIds: string[];
    sourceExplanationIds: string[];
    evidence: ExplicitEvidenceReference[];
  }): CollaborationPreferenceRecord {
    return {
      preferenceId: this.metadata.buildPreferenceId(),
      timestamp: new Date().toISOString(),
      preferenceVersion: input.version,
      preferenceCategory: input.category,
      preferenceDescription: input.description,
      sourceApprovalIds: input.sourceApprovalIds,
      sourceProposalIds: input.sourceProposalIds,
      sourceExplanationIds: input.sourceExplanationIds,
      sourceConversationIds: [],
      sourceAnnotationIds: [],
      learnedBehaviorSummary: input.summary,
      confidenceScore: Math.round(input.confidence * 100) / 100,
      explicitEvidenceReferences: input.evidence,
      currentStatus: "learned",
      metadataVersion: PREFERENCE_METADATA_VERSION,
    };
  }
}
