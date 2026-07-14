/** T5-09 — Recommendation improvement from accumulated learning. */

import type { RawLearningCandidate } from "./types.js";

export class RecommendationImprovementEngine {
  improve(existing: RawLearningCandidate[]): RawLearningCandidate[] {
    if (!existing.length) return [];

    const top = existing[0]!;
    return [
      {
        learningCategory: "continuous_ux_intelligence_learning",
        learnedUxInsight: "Synthesized recommendation improvement from learning cycle",
        improvementSummary: `Consolidated ${existing.length} learning signals into recommendation weights`,
        recommendationImprovement: `Apply learned weights from: ${top.learningCategory.replace(/_/g, " ")}`,
        prioritizationImprovement: top.prioritizationImprovement,
        sourceRedesignHistory: existing.flatMap((c) => c.sourceRedesignHistory).slice(0, 5),
        sourceDeploymentOutcomes: existing.flatMap((c) => c.sourceDeploymentOutcomes).slice(0, 5),
        sourceApprovalHistory: existing.flatMap((c) => c.sourceApprovalHistory).slice(0, 5),
        evidenceReferences: existing.flatMap((c) => c.evidenceReferences).slice(0, 8),
        confidenceScore: Math.min(
          0.95,
          existing.reduce((sum, c) => sum + c.confidenceScore, 0) / existing.length + 0.05,
        ),
        impactScore: 0.72,
        sourceEngine: "PILLOW-SIUX-001",
        sourceWorkspaceIntelligenceId: top.sourceWorkspaceIntelligenceId,
        sourceUxEvolutionId: top.sourceUxEvolutionId,
        sourceWorkflowEvolutionId: top.sourceWorkflowEvolutionId,
      },
    ];
  }
}
