/** T5-09 — Machine-readable UX learning metadata generation. */

import { randomUUID } from "node:crypto";
import { UX_LEARNING_METADATA_VERSION } from "./paths.js";
import type { LearningStatus, RawLearningCandidate, UxLearningRecord } from "./types.js";

export class LearningMetadataGenerator {
  buildRecords(input: {
    candidates: RawLearningCandidate[];
    recordStatus: LearningStatus;
  }): UxLearningRecord[] {
    return input.candidates.map((candidate) => ({
      learningId: `siux-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceWorkspaceIntelligenceId: candidate.sourceWorkspaceIntelligenceId ?? null,
      sourceUxEvolutionId: candidate.sourceUxEvolutionId ?? null,
      sourceWorkflowEvolutionId: candidate.sourceWorkflowEvolutionId ?? null,
      sourceRedesignHistory: candidate.sourceRedesignHistory,
      sourceDeploymentOutcomes: candidate.sourceDeploymentOutcomes,
      sourceApprovalHistory: candidate.sourceApprovalHistory,
      learnedUxInsight: candidate.learnedUxInsight,
      improvementSummary: candidate.improvementSummary,
      recommendationImprovement: candidate.recommendationImprovement,
      prioritizationImprovement: candidate.prioritizationImprovement,
      learningCategory: candidate.learningCategory,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: UX_LEARNING_METADATA_VERSION,
      learnOnly: true,
    }));
  }
}
