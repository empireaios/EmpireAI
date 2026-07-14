/** T4-08 — Analyzes explanation presentation preferences from T4-06. */

import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord, ExplicitEvidenceReference } from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class ExplanationPreferenceAnalyzer {
  private readonly metadata = new PreferenceMetadataGenerator();

  analyze(input: {
    config: PreferenceLearningConfiguration;
    explainDecisions: ExplainDecisionsEngine | null;
    version: string;
  }): CollaborationPreferenceRecord[] {
    appendPreferenceLog({
      event: "explanation_learning",
      level: "info",
      details: "Analyzing explanation presentation preferences",
    });

    if (!input.explainDecisions) return [];

    const report = input.explainDecisions.getLatestReport?.() ?? null;
    const explanation = report?.explanation ?? null;
    if (!explanation) return [];

    const evidence: ExplicitEvidenceReference[] = [
      {
        evidenceId: this.metadata.buildEvidenceId(),
        evidenceType: "explanation",
        sourceId: explanation.explanationId,
        summary: `${explanation.explanationType}: ${explanation.designRationale.slice(0, 80)}`,
        strength: "explicit",
      },
    ];

    const detailLevel = input.config.learningScope === "comprehensive" ? "detailed" : "standard";

    return [
      {
        preferenceId: this.metadata.buildPreferenceId(),
        timestamp: new Date().toISOString(),
        preferenceVersion: input.version,
        preferenceCategory: "explanation_presentation",
        preferenceDescription: "Preferred explanation style and detail level",
        sourceApprovalIds: [],
        sourceProposalIds: explanation.sourceProposalIds,
        sourceExplanationIds: [explanation.explanationId],
        sourceConversationIds: [],
        sourceAnnotationIds: [],
        learnedBehaviorSummary: `Prefers ${detailLevel} ${explanation.explanationType} explanations with evidence-linked rationale`,
        confidenceScore: explanation.confidenceScore,
        explicitEvidenceReferences: evidence,
        currentStatus: "learned",
        metadataVersion: PREFERENCE_METADATA_VERSION,
      },
      {
        preferenceId: this.metadata.buildPreferenceId(),
        timestamp: new Date().toISOString(),
        preferenceVersion: input.version,
        preferenceCategory: "information_density",
        preferenceDescription: "Information density preference from explanation depth",
        sourceApprovalIds: [],
        sourceProposalIds: explanation.sourceProposalIds,
        sourceExplanationIds: [explanation.explanationId],
        sourceConversationIds: [],
        sourceAnnotationIds: [],
        learnedBehaviorSummary:
          explanation.weakEvidenceNotes.length > 0
            ? "Accepts partial evidence with explicit weak-evidence disclosure"
            : "Prefers fully evidenced explanations",
        confidenceScore: Math.max(0.45, explanation.confidenceScore - 0.05),
        explicitEvidenceReferences: evidence,
        currentStatus: "learned",
        metadataVersion: PREFERENCE_METADATA_VERSION,
      },
    ];
  }
}
