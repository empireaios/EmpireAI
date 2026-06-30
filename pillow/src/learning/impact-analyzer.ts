import type { ExecutiveLearningCategory, ExtractedLearningCandidate, ReasoningArea } from "./types.js";

export interface ImpactAnalysis {
  summary: string;
  affectedReasoningAreas: ReasoningArea[];
  riskLevel: "low" | "medium" | "high";
  permanentBehaviorChange: boolean;
  requiresExplicitApproval: boolean;
}

export function analyzeLearningImpact(
  candidate: ExtractedLearningCandidate,
): ImpactAnalysis {
  const permanentBehaviorChange = candidate.category === "A";
  const requiresExplicitApproval =
    candidate.category === "A" || candidate.category === "B";

  const riskLevel: ImpactAnalysis["riskLevel"] =
    candidate.category === "A"
      ? "high"
      : candidate.category === "B"
        ? "medium"
        : "low";

  return {
    summary: candidate.impactSummary,
    affectedReasoningAreas: candidate.reasoningAreas,
    riskLevel,
    permanentBehaviorChange,
    requiresExplicitApproval,
  };
}

export function mergeReasoningAreas(
  ...groups: ReasoningArea[][]
): ReasoningArea[] {
  return [...new Set(groups.flat())];
}

export function categoryAllowsPermanentStorage(category: ExecutiveLearningCategory): boolean {
  return category === "A" || category === "B" || category === "C";
}
