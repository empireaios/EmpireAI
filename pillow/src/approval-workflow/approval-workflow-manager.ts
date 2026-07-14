/** T4-07 — Approval Workflow Manager — core approval pipeline. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type {
  ApprovalInput,
  ApprovalPresentation,
  ApprovalPresentationInput,
  ApprovalRecord,
  ApprovalRunReport,
} from "./types.js";
import { ApprovalSessionManager } from "./approval-session-manager.js";
import { ProposalApprovalMapper } from "./proposal-approval-mapper.js";
import { ComparisonApprovalMapper } from "./comparison-approval-mapper.js";
import { ExplanationApprovalMapper } from "./explanation-approval-mapper.js";
import { ApprovalDecisionEngine } from "./approval-decision-engine.js";
import { ApprovalGatekeeper } from "./approval-gatekeeper.js";
import { ApprovedActionDispatcher } from "./approved-action-dispatcher.js";
import { ApprovalMetadataGenerator } from "./approval-metadata-generator.js";
import { ApprovalValidator } from "./approval-validator.js";
import { appendApprovalLog } from "./approval-logging.js";
import { APPROVAL_METADATA_VERSION } from "./paths.js";

export type ApprovalWorkflowEngineBundle = {
  multiProposalGenerator: MultiProposalGeneratorEngine | null;
  sideBySideComparison: SideBySideComparisonEngine | null;
  explainDecisions: ExplainDecisionsEngine | null;
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
};

export class ApprovalWorkflowManager {
  private readonly sessions = new ApprovalSessionManager();
  private readonly proposalMapper = new ProposalApprovalMapper();
  private readonly comparisonMapper = new ComparisonApprovalMapper();
  private readonly explanationMapper = new ExplanationApprovalMapper();
  private readonly decisionEngine = new ApprovalDecisionEngine();
  private readonly gatekeeper = new ApprovalGatekeeper();
  private readonly dispatcher = new ApprovedActionDispatcher();
  private readonly metadata = new ApprovalMetadataGenerator();
  private readonly validator = new ApprovalValidator();
  private latestPresentation: ApprovalPresentation | null = null;

  present(input: {
    presentationInput: ApprovalPresentationInput;
    config: ApprovalWorkflowConfiguration;
    engines: ApprovalWorkflowEngineBundle;
  }): ApprovalPresentation {
    const session = this.sessions.startSession(input.presentationInput.sessionId);
    const { proposals, targetScreenId, targetRouteOrViewId } = this.proposalMapper.load({
      presentationInput: input.presentationInput,
      multiProposalGenerator: input.engines.multiProposalGenerator,
    });
    const comparison = this.comparisonMapper.load({
      presentationInput: input.presentationInput,
      sideBySideComparison: input.engines.sideBySideComparison,
    });
    const explanation = this.explanationMapper.load({
      presentationInput: input.presentationInput,
      explainDecisions: input.engines.explainDecisions,
    });

    const presentation: ApprovalPresentation = {
      presentationId: this.metadata.buildPresentationId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      sourceProposalIds: proposals.map((p) => p.proposalId),
      sourceComparisonId: comparison?.comparisonId ?? null,
      sourceExplanationId: explanation?.explanationId ?? null,
      targetScreenId,
      targetRouteOrViewId,
      proposalSummaries: proposals.map((p) => ({
        proposalId: p.proposalId,
        title: p.proposalTitle,
        category: p.proposalCategory,
      })),
      comparisonSummary: comparison?.differenceSummary ?? null,
      explanationSummary: explanation?.designRationale ?? null,
      requiresApproval: input.config.approvalRequirementRulesEnabled,
      metadataVersion: APPROVAL_METADATA_VERSION,
    };

    this.latestPresentation = presentation;
    appendApprovalLog({
      event: "approval_workflow_start",
      level: "info",
      details: `Presented ${proposals.length} proposal(s) for Grand King approval`,
    });

    return presentation;
  }

  submitApproval(input: {
    approvalInput: ApprovalInput;
    config: ApprovalWorkflowConfiguration;
    engines: ApprovalWorkflowEngineBundle;
  }): ApprovalRunReport {
    const started = Date.now();
    appendApprovalLog({
      event: "approval_workflow_start",
      level: "info",
      details: `Submitting approval decision: ${input.approvalInput.approvalDecision}`,
    });

    let session = this.sessions.startSession(input.approvalInput.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistoryApprovals);

    const presentationInput: ApprovalPresentationInput = {
      sessionId: session.sessionId,
      proposalIds: input.approvalInput.proposalIds,
      comparisonId: input.approvalInput.comparisonId,
      explanationId: input.approvalInput.explanationId,
    };

    const { proposals, targetScreenId, targetRouteOrViewId } = this.proposalMapper.load({
      presentationInput,
      multiProposalGenerator: input.engines.multiProposalGenerator,
    });
    const comparison = this.comparisonMapper.load({
      presentationInput,
      sideBySideComparison: input.engines.sideBySideComparison,
    });
    const explanation = this.explanationMapper.load({
      presentationInput,
      explainDecisions: input.engines.explainDecisions,
    });

    const presentation = this.present({
      presentationInput,
      config: input.config,
      engines: input.engines,
    });

    const decisionCheck = this.decisionEngine.validateDecision(
      input.approvalInput.approvalDecision,
      input.config,
      {
        hasComparison: comparison !== null,
        hasExplanation: explanation !== null,
        requestedChanges: input.approvalInput.requestedChanges,
      },
    );
    if (!decisionCheck.valid) {
      throw new Error(decisionCheck.errors.join("; "));
    }

    const status = this.decisionEngine.resolveStatus(input.approvalInput.approvalDecision);
    const gate = this.gatekeeper.evaluate({
      decision: input.approvalInput.approvalDecision,
      status,
      config: input.config,
    });

    const targetProposal = this.resolveTargetProposal(
      proposals,
      input.approvalInput.targetProposalId,
    );
    const confidenceScore = this.computeConfidence(proposals, explanation?.confidenceScore);

    const approval: ApprovalRecord = this.metadata.enrichApproval({
      approvalId: this.metadata.buildApprovalId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      sourceProposalIds: proposals.map((p) => p.proposalId),
      sourceComparisonId: comparison?.comparisonId ?? null,
      sourceExplanationId: explanation?.explanationId ?? null,
      targetScreenId,
      targetRouteOrViewId,
      approvalDecision: input.approvalInput.approvalDecision,
      approvalStatus: status,
      approvalRationale: input.approvalInput.approvalRationale ?? null,
      requestedChanges:
        input.approvalInput.approvalDecision === "request_changes"
          ? (input.approvalInput.requestedChanges ?? null)
          : null,
      approvedActionScope: gate.approvedScope,
      blockedActionScope: gate.blockedScope,
      grandKingConfirmationRef: input.approvalInput.grandKingConfirmationRef ?? null,
      confidenceScore,
      metadataVersion: APPROVAL_METADATA_VERSION,
    });

    const dispatch = this.dispatcher.dispatch({
      status: gate.allowed ? "approved" : approval.approvalStatus,
      approvedScope: gate.approvedScope,
      proposalIds: targetProposal ? [targetProposal.proposalId] : proposals.map((p) => p.proposalId),
      config: input.config,
      autonomousBuilderCertification: input.engines.autonomousBuilderCertification,
    });

    if (dispatch.dispatched) {
      approval.approvalStatus = "dispatched";
    } else if (gate.blocked) {
      approval.approvalStatus =
        approval.approvalStatus === "approved" ? "blocked" : approval.approvalStatus;
    }

    session = this.sessions.appendApproval(session.sessionId, approval, approval.approvalStatus);
    const validation = this.validator.validate(approval, input.config, {
      autoApproved: false,
      implementationAttempted: !gate.allowed && input.approvalInput.approvalDecision === "approve",
    });

    appendApprovalLog({
      event: "approval_workflow_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Approval ${validation.decision.toUpperCase()} · ${input.approvalInput.approvalDecision}`,
    });

    this.sessions.endSession(session.sessionId);

    return {
      approvalRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: { ...session, status: "completed" },
      approval,
      presentation,
      gatekeeperResult: {
        allowed: gate.allowed,
        blocked: gate.blocked,
        reason: gate.reason,
      },
      dispatchResult: dispatch,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: APPROVAL_METADATA_VERSION,
    };
  }

  private resolveTargetProposal(
    proposals: RedesignProposalRecord[],
    targetProposalId?: string | null,
  ): RedesignProposalRecord | null {
    if (!targetProposalId) return proposals[0] ?? null;
    return proposals.find((p) => p.proposalId === targetProposalId) ?? proposals[0] ?? null;
  }

  private computeConfidence(
    proposals: RedesignProposalRecord[],
    explanationConfidence?: number,
  ): number {
    const proposalAvg =
      proposals.length > 0
        ? proposals.reduce((s, p) => s + p.confidenceScore, 0) / proposals.length
        : 0.4;
    if (explanationConfidence !== undefined) {
      return Math.round(((proposalAvg + explanationConfidence) / 2) * 100) / 100;
    }
    return Math.round(proposalAvg * 100) / 100;
  }

  getLatestPresentation(): ApprovalPresentation | null {
    return this.latestPresentation;
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.latestPresentation = null;
  }
}
