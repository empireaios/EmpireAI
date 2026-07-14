/** T5-09 — Learning from redesign and change documentation history. */

import type { ChangeDocumentationRecord } from "../change-documentation/types.js";
import type { WorkspaceIntelligenceRecord } from "../executive-workspace-intelligence-engine/types.js";
import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { RawLearningCandidate } from "./types.js";

export class RedesignLearningEngine {
  learn(input: {
    workspaceRecords: WorkspaceIntelligenceRecord[];
    uxEvolutionRecords: UxEvolutionRecord[];
    changeRecords: ChangeDocumentationRecord[];
  }): RawLearningCandidate[] {
    const candidates: RawLearningCandidate[] = [];

    for (const change of input.changeRecords) {
      const status = change.finalChangeStatus ?? "pending";
      candidates.push({
        learningCategory: "redesign_learning",
        learnedUxInsight: `Redesign outcome: ${status} · ${change.changeSummary ?? "UX change"}`,
        improvementSummary: `Incorporate ${status} redesign patterns into future recommendations`,
        recommendationImprovement: `Weight ${status} redesign evidence when generating UX proposals`,
        prioritizationImprovement: `Adjust priority for changes similar to ${status} redesigns`,
        sourceRedesignHistory: [change.changeDocumentationId],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [...(change.evidenceReferences ?? []), `change:${change.changeDocumentationId}`],
        confidenceScore: change.confidenceScore ?? 0.65,
        impactScore: status === "accepted" ? 0.82 : 0.68,
        sourceEngine: "PILLOW-CD-001",
      });
    }

    for (const ewi of input.workspaceRecords) {
      candidates.push({
        learningCategory: "workspace_learning",
        learnedUxInsight: `Workspace redesign signal: ${ewi.workspaceCategory}`,
        improvementSummary: "Apply workspace intelligence to future dashboard recommendations",
        recommendationImprovement: `Elevate ${ewi.workspaceCategory.replace(/_/g, " ")} in recommendation engine`,
        prioritizationImprovement: `Boost priority for ${ewi.workspacePriority} workspace patterns`,
        sourceRedesignHistory: [`ewi:${ewi.workspaceIntelligenceId}`],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [...ewi.evidenceReferences, `ewi:${ewi.workspaceIntelligenceId}`],
        confidenceScore: ewi.confidenceScore,
        impactScore: 0.76,
        sourceEngine: "PILLOW-EWI-001",
        sourceWorkspaceIntelligenceId: ewi.workspaceIntelligenceId,
      });
    }

    for (const cue of input.uxEvolutionRecords) {
      candidates.push({
        learningCategory: "continuous_ux_intelligence_learning",
        learnedUxInsight: `UX evolution pattern: ${cue.evolutionCategory}`,
        improvementSummary: cue.expectedUxBenefit,
        recommendationImprovement: `Refine recommendations using: ${cue.recommendedUxImprovements[0] ?? "evolution insight"}`,
        prioritizationImprovement: `Prioritize ${cue.improvementPriority} evolution categories`,
        sourceRedesignHistory: [`cue:${cue.uxEvolutionId}`],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [...cue.evidenceReferences, `cue:${cue.uxEvolutionId}`],
        confidenceScore: cue.confidenceScore,
        impactScore: 0.74,
        sourceEngine: "PILLOW-CUE-001",
        sourceUxEvolutionId: cue.uxEvolutionId,
      });
    }

    return candidates;
  }
}
