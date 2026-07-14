/** T4-06 — Explain Decisions Manager — core explanation pipeline. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import type { ExplanationInput, ExplanationRecord, ExplanationRunReport } from "./types.js";
import { ExplanationSessionManager } from "./explanation-session-manager.js";
import { ProposalRationaleGenerator } from "./proposal-rationale-generator.js";
import { ComparisonRationaleGenerator } from "./comparison-rationale-generator.js";
import { UxEvidenceLinker } from "./ux-evidence-linker.js";
import { TradeoffAnalyzer } from "./tradeoff-analyzer.js";
import { AccessibilityRationaleGenerator } from "./accessibility-rationale-generator.js";
import { ConsistencyRationaleGenerator } from "./consistency-rationale-generator.js";
import { WorkflowRationaleGenerator } from "./workflow-rationale-generator.js";
import { ExecutivePreferenceRationaleGenerator } from "./executive-preference-rationale-generator.js";
import { DesignRationaleEngine } from "./design-rationale-engine.js";
import { ExplanationMetadataGenerator } from "./explanation-metadata-generator.js";
import { ExplanationValidator } from "./explanation-validator.js";
import { appendExplanationLog } from "./explanation-logging.js";
import { EXPLANATION_METADATA_VERSION } from "./paths.js";

export type ExplainDecisionsEngineBundle = {
  multiProposalGenerator: MultiProposalGeneratorEngine | null;
  sideBySideComparison: SideBySideComparisonEngine | null;
  uxScoring: UxScoringEngine | null;
  recommendationEngine: RecommendationEngine | null;
  previewGenerator: PreviewGenerator | null;
  validationEngine: ValidationEngine | null;
};

export class ExplainDecisionsManager {
  private readonly sessions = new ExplanationSessionManager();
  private readonly proposalRationale = new ProposalRationaleGenerator();
  private readonly comparisonRationale = new ComparisonRationaleGenerator();
  private readonly evidenceLinker = new UxEvidenceLinker();
  private readonly tradeoffAnalyzer = new TradeoffAnalyzer();
  private readonly accessibilityRationale = new AccessibilityRationaleGenerator();
  private readonly consistencyRationale = new ConsistencyRationaleGenerator();
  private readonly workflowRationale = new WorkflowRationaleGenerator();
  private readonly executiveRationale = new ExecutivePreferenceRationaleGenerator();
  private readonly designRationale = new DesignRationaleEngine();
  private readonly metadata = new ExplanationMetadataGenerator();
  private readonly validator = new ExplanationValidator();

  explain(input: {
    explanationInput: ExplanationInput;
    config: ExplainDecisionsConfiguration;
    engines: ExplainDecisionsEngineBundle;
  }): ExplanationRunReport {
    const started = Date.now();
    appendExplanationLog({
      event: "explain_decisions_start",
      level: "info",
      details: `Starting explanation type ${input.explanationInput.explanationType}`,
    });

    let session = this.sessions.startSession(input.explanationInput.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistoryExplanations);

    const { proposals, targetScreenId, targetRouteOrViewId } = this.loadProposals(
      input.explanationInput,
      input.config,
      input.engines.multiProposalGenerator,
    );
    const comparison = this.loadComparison(
      input.explanationInput,
      input.engines.sideBySideComparison,
    );

    const evidenceBundle = this.evidenceLinker.link({
      proposals,
      config: input.config,
      uxScoring: input.engines.uxScoring,
      recommendationEngine: input.engines.recommendationEngine,
      validationEngine: input.engines.validationEngine,
      previewGenerator: input.engines.previewGenerator,
    });

    const proposalResult = this.proposalRationale.generate({
      proposals,
      config: input.config,
      targetProposalId: input.explanationInput.targetProposalId,
    });
    const comparisonText = this.comparisonRationale.generate({
      comparison,
      proposals,
      config: input.config,
    });
    const designRationale = this.designRationale.synthesize({
      explanationType: input.explanationInput.explanationType,
      proposalRationale: proposalResult.rationale,
      comparisonRationale: comparisonText,
      config: input.config,
    });
    const tradeoffSummary = this.tradeoffAnalyzer.analyze({
      proposals,
      comparison,
      config: input.config,
      targetProposalId: input.explanationInput.targetProposalId,
    });

    const avgConfidence =
      proposals.length > 0
        ? proposals.reduce((s, p) => s + p.confidenceScore, 0) / proposals.length
        : 0.4;
    const evidencePenalty = evidenceBundle.weakNotes.length * 0.05;
    const confidenceScore = Math.max(
      0,
      Math.min(1, Math.round((avgConfidence - evidencePenalty) * 100) / 100),
    );

    const explanation: ExplanationRecord = this.metadata.enrichExplanation({
      explanationId: this.metadata.buildExplanationId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      explanationType: input.explanationInput.explanationType,
      sourceProposalIds: proposals.map((p) => p.proposalId),
      sourceComparisonId: comparison?.comparisonId ?? null,
      sourceUxFindingIds: evidenceBundle.uxFindingIds,
      sourceUxScoreIds: evidenceBundle.uxScoreIds,
      sourceRecommendationIds: evidenceBundle.recommendationIds,
      targetScreenId,
      targetRouteOrViewId,
      designRationale,
      uxBenefitSummary: proposalResult.benefitSummary,
      tradeoffSummary,
      evidenceReferences: evidenceBundle.evidence,
      accessibilityRationale: this.accessibilityRationale.generate({
        proposals,
        comparison,
        config: input.config,
      }),
      consistencyRationale: this.consistencyRationale.generate({
        proposals,
        comparison,
        config: input.config,
      }),
      workflowRationale: this.workflowRationale.generate({
        proposals,
        comparison,
        config: input.config,
      }),
      executivePreferenceRationale: this.executiveRationale.generate({
        proposals,
        config: input.config,
        recommendationEngine: input.engines.recommendationEngine,
      }),
      weakEvidenceNotes: evidenceBundle.weakNotes,
      confidenceScore,
      explanationStatus: "validated",
      metadataVersion: EXPLANATION_METADATA_VERSION,
    });

    session = this.sessions.appendExplanation(session.sessionId, explanation, "completed");
    const validation = this.validator.validate(explanation, input.config, {
      appliedChanges: false,
      approvedChanges: false,
    });

    appendExplanationLog({
      event: "explain_decisions_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Explanation ${validation.decision.toUpperCase()} · ${evidenceBundle.evidence.length} evidence refs`,
    });

    this.sessions.endSession(session.sessionId);

    return {
      explanationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: { ...session, status: "completed" },
      explanation,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: EXPLANATION_METADATA_VERSION,
    };
  }

  private loadProposals(
    input: ExplanationInput,
    config: ExplainDecisionsConfiguration,
    multiProposalGenerator: MultiProposalGeneratorEngine | null,
  ): {
    proposals: RedesignProposalRecord[];
    targetScreenId: string | null;
    targetRouteOrViewId: string | null;
  } {
    appendExplanationLog({
      event: "proposal_rationale_generation",
      level: "info",
      details: "Loading proposals for explanation",
    });

    let proposals: RedesignProposalRecord[] = [];
    if (multiProposalGenerator) {
      try {
        const report = multiProposalGenerator.getLatestReport?.() ?? null;
        proposals = report?.proposals ?? [];
      } catch {
        appendExplanationLog({
          event: "partial_explanation_input",
          level: "warn",
          details: "Multi-proposal generator data unavailable",
        });
      }
    }

    if (input.proposalIds?.length) {
      const ids = new Set(input.proposalIds);
      proposals = proposals.filter((p) => ids.has(p.proposalId));
    }

    if (proposals.length === 0) {
      throw new Error("No proposal records available for explanation");
    }

    proposals = proposals.slice(0, 8);
    return {
      proposals,
      targetScreenId: proposals[0]?.targetScreenId ?? null,
      targetRouteOrViewId: proposals[0]?.targetRouteOrViewId ?? null,
    };
  }

  private loadComparison(
    input: ExplanationInput,
    sideBySideComparison: SideBySideComparisonEngine | null,
  ): SideBySideComparisonRecord | null {
    if (!sideBySideComparison) return null;
    try {
      const report = sideBySideComparison.getLatestReport?.() ?? null;
      const comparison = report?.comparison ?? null;
      if (input.comparisonId && comparison?.comparisonId !== input.comparisonId) {
        return comparison;
      }
      return comparison;
    } catch {
      appendExplanationLog({
        event: "partial_explanation_input",
        level: "warn",
        details: "Side-by-side comparison data unavailable",
      });
      return null;
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
  }
}
