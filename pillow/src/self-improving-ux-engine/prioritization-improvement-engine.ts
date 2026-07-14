/** T5-09 — Prioritization improvement from accumulated learning. */

import type { RawLearningCandidate } from "./types.js";

export class PrioritizationImprovementEngine {
  improve(existing: RawLearningCandidate[]): RawLearningCandidate[] {
    const approvalLearnings = existing.filter((c) => c.learningCategory === "approval_learning");
    const deploymentLearnings = existing.filter((c) => c.learningCategory === "deployment_learning");

    if (!approvalLearnings.length && !deploymentLearnings.length) return [];

    return [
      {
        learningCategory: "executive_preference_learning",
        learnedUxInsight: "Prioritization calibrated from approval and deployment outcomes",
        improvementSummary: "Future UX prioritization reflects Grand King decisions and deployments",
        recommendationImprovement: "Align recommendation confidence with executive preference signals",
        prioritizationImprovement:
          "Boost approved patterns · reduce rejected patterns · weight deployment success",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: deploymentLearnings
          .flatMap((c) => c.sourceDeploymentOutcomes)
          .slice(0, 5),
        sourceApprovalHistory: approvalLearnings
          .flatMap((c) => c.sourceApprovalHistory)
          .slice(0, 5),
        evidenceReferences: [
          ...approvalLearnings.flatMap((c) => c.evidenceReferences),
          ...deploymentLearnings.flatMap((c) => c.evidenceReferences),
        ].slice(0, 8),
        confidenceScore: 0.72,
        impactScore: 0.78,
        sourceEngine: "PILLOW-SIUX-001",
      },
    ];
  }
}
