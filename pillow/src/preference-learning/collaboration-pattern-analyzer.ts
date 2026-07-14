/** T4-08 — Analyzes collaboration patterns from annotations and comparisons. */

import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord, ExplicitEvidenceReference } from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class CollaborationPatternAnalyzer {
  private readonly metadata = new PreferenceMetadataGenerator();

  analyze(input: {
    config: PreferenceLearningConfiguration;
    sideBySideComparison: SideBySideComparisonEngine | null;
    screenAnnotation: ScreenAnnotationEngine | null;
    version: string;
  }): CollaborationPreferenceRecord[] {
    appendPreferenceLog({
      event: "preference_learning_start",
      level: "info",
      details: "Analyzing collaboration patterns",
    });

    const preferences: CollaborationPreferenceRecord[] = [];

    if (input.sideBySideComparison && input.config.learningScope !== "minimal") {
      const report = input.sideBySideComparison.getLatestReport?.() ?? null;
      const comparison = report?.comparison ?? null;
      if (comparison) {
        const evidence: ExplicitEvidenceReference[] = [
          {
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "comparison",
            sourceId: comparison.comparisonId,
            summary: `${comparison.comparisonType}: ${comparison.comparedOptions.length} options`,
            strength: "explicit",
          },
        ];
        preferences.push({
          preferenceId: this.metadata.buildPreferenceId(),
          timestamp: new Date().toISOString(),
          preferenceVersion: input.version,
          preferenceCategory: "comparison_preference",
          preferenceDescription: "Side-by-side comparison workflow preference",
          sourceApprovalIds: [],
          sourceProposalIds: comparison.sourceProposalIds,
          sourceExplanationIds: [],
          sourceConversationIds: [],
          sourceAnnotationIds: [],
          learnedBehaviorSummary: `Uses ${comparison.comparisonType} comparisons with ${comparison.comparedOptions.length} options`,
          confidenceScore: comparison.confidenceScore,
          explicitEvidenceReferences: evidence,
          currentStatus: "learned",
          metadataVersion: PREFERENCE_METADATA_VERSION,
        });
        preferences.push({
          preferenceId: this.metadata.buildPreferenceId(),
          timestamp: new Date().toISOString(),
          preferenceVersion: input.version,
          preferenceCategory: "preferred_visualization",
          preferenceDescription: "Visual comparison format preference",
          sourceApprovalIds: [],
          sourceProposalIds: comparison.sourceProposalIds,
          sourceExplanationIds: [],
          sourceConversationIds: [],
          sourceAnnotationIds: [],
          learnedBehaviorSummary: `Reviews ${comparison.visualDifferenceMarkers.length} highlighted visual differences`,
          confidenceScore: Math.max(0.5, comparison.confidenceScore - 0.1),
          explicitEvidenceReferences: evidence,
          currentStatus: "learned",
          metadataVersion: PREFERENCE_METADATA_VERSION,
        });
        preferences.push({
          preferenceId: this.metadata.buildPreferenceId(),
          timestamp: new Date().toISOString(),
          preferenceVersion: input.version,
          preferenceCategory: "review_sequence",
          preferenceDescription: "Review sequence: compare before deciding",
          sourceApprovalIds: [],
          sourceProposalIds: comparison.sourceProposalIds,
          sourceExplanationIds: [],
          sourceConversationIds: [],
          sourceAnnotationIds: [],
          learnedBehaviorSummary: "Follows compare-then-decide collaboration sequence",
          confidenceScore: 0.65,
          explicitEvidenceReferences: evidence,
          currentStatus: "learned",
          metadataVersion: PREFERENCE_METADATA_VERSION,
        });
      }
    }

    if (input.screenAnnotation) {
      const report = input.screenAnnotation.getLatestReport?.() ?? null;
      const annotation = report?.latestAnnotation ?? null;
      if (annotation) {
        const evidence: ExplicitEvidenceReference[] = [
          {
            evidenceId: this.metadata.buildEvidenceId(),
            evidenceType: "annotation",
            sourceId: annotation.annotationId,
            summary: `${annotation.annotationType}: ${annotation.userInstructionSummary.slice(0, 80)}`,
            strength: "explicit",
          },
        ];
        preferences.push({
          preferenceId: this.metadata.buildPreferenceId(),
          timestamp: new Date().toISOString(),
          preferenceVersion: input.version,
          preferenceCategory: "annotation_preference",
          preferenceDescription: "Screen annotation collaboration style",
          sourceApprovalIds: [],
          sourceProposalIds: [],
          sourceExplanationIds: [],
          sourceConversationIds: annotation.linkedConversationIntentId
            ? [annotation.linkedConversationIntentId]
            : [],
          sourceAnnotationIds: [annotation.annotationId],
          learnedBehaviorSummary: `Uses ${annotation.annotationType} annotations to direct UX feedback`,
          confidenceScore: annotation.confidenceScore,
          explicitEvidenceReferences: evidence,
          currentStatus: "learned",
          metadataVersion: PREFERENCE_METADATA_VERSION,
        });
      }
    }

    return preferences;
  }
}
