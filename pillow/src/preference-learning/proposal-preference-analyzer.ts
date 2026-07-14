/** T4-08 — Analyzes proposal presentation preferences from T4-04. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord, ExplicitEvidenceReference } from "./types.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class ProposalPreferenceAnalyzer {
  private readonly metadata = new PreferenceMetadataGenerator();

  analyze(input: {
    config: PreferenceLearningConfiguration;
    multiProposalGenerator: MultiProposalGeneratorEngine | null;
    version: string;
  }): CollaborationPreferenceRecord[] {
    appendPreferenceLog({
      event: "proposal_learning",
      level: "info",
      details: "Analyzing proposal presentation preferences",
    });

    if (!input.multiProposalGenerator) return [];

    const report = input.multiProposalGenerator.getLatestReport?.() ?? null;
    const proposals = report?.proposals ?? [];
    if (proposals.length === 0) return [];

    const categories = [...new Set(proposals.map((p) => p.proposalCategory))];
    const evidence: ExplicitEvidenceReference[] = proposals.slice(0, 3).map((p) => ({
      evidenceId: this.metadata.buildEvidenceId(),
      evidenceType: "proposal",
      sourceId: p.proposalId,
      summary: `${p.proposalCategory}: ${p.proposalTitle.slice(0, 60)}`,
      strength: "explicit" as const,
    }));

    const preferences: CollaborationPreferenceRecord[] = [
      {
        preferenceId: this.metadata.buildPreferenceId(),
        timestamp: new Date().toISOString(),
        preferenceVersion: input.version,
        preferenceCategory: "proposal_presentation",
        preferenceDescription: "Preferred proposal categories and presentation style",
        sourceApprovalIds: [],
        sourceProposalIds: proposals.map((p) => p.proposalId),
        sourceExplanationIds: [],
        sourceConversationIds: [],
        sourceAnnotationIds: [],
        learnedBehaviorSummary: `Receives ${proposals.length} proposals across ${categories.length} categories: ${categories.slice(0, 4).join(", ")}`,
        confidenceScore: Math.round(
          (proposals.reduce((s, p) => s + p.confidenceScore, 0) / proposals.length) * 100,
        ) / 100,
        explicitEvidenceReferences: evidence,
        currentStatus: "learned",
        metadataVersion: PREFERENCE_METADATA_VERSION,
      },
    ];

    if (input.config.learningScope === "comprehensive") {
      const topCategory = categories[0];
      if (topCategory) {
        preferences.push({
          preferenceId: this.metadata.buildPreferenceId(),
          timestamp: new Date().toISOString(),
          preferenceVersion: input.version,
          preferenceCategory: "collaboration_style",
          preferenceDescription: "Collaboration style inferred from proposal diversity",
          sourceApprovalIds: [],
          sourceProposalIds: proposals.map((p) => p.proposalId),
          sourceExplanationIds: [],
          sourceConversationIds: [],
          sourceAnnotationIds: [],
          learnedBehaviorSummary: `Engages with diverse proposal options; leading category: ${topCategory}`,
          confidenceScore: 0.55,
          explicitEvidenceReferences: evidence,
          currentStatus: "learned",
          metadataVersion: PREFERENCE_METADATA_VERSION,
        });
      }
    }

    return preferences;
  }
}
