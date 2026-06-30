import type {
  CategoryReviewResult,
  ReviewDecision,
  ReviewRecommendation,
} from "./types.js";

export function determineReviewDecision(
  categories: CategoryReviewResult[],
  recommendations: ReviewRecommendation[],
  acceptanceFailed: boolean,
): { decision: ReviewDecision; reasoning: string } {
  const mandatoryBlocks = recommendations.filter((r) => r.blocksApproval);
  if (mandatoryBlocks.length > 0) {
    return {
      decision: "rejected",
      reasoning: `Mandatory corrections block approval: ${mandatoryBlocks.map((r) => r.summary).join("; ")}`,
    };
  }

  const failed = categories.filter((c) => c.result === "failed");
  const partial = categories.filter((c) => c.result === "partially_passed");
  const unverified = categories.filter((c) => c.result === "unable_to_verify");

  if (acceptanceFailed) {
    return {
      decision: "rejected",
      reasoning: "One or more acceptance criteria failed verification",
    };
  }

  if (
    failed.some((c) =>
      ["repository_ownership", "governance_compliance"].includes(c.category),
    )
  ) {
    return {
      decision: "rejected",
      reasoning: "Critical repository ownership or governance compliance failure",
    };
  }

  if (failed.length >= 2) {
    return {
      decision: "rejected",
      reasoning: `Multiple review categories failed: ${failed.map((c) => c.category).join(", ")}`,
    };
  }

  if (
    failed.some((c) => c.category === "validation_quality") ||
    unverified.length >= 4
  ) {
    return {
      decision: "manual_review_required",
      reasoning: "Validation quality insufficient or too many categories unverifiable — Grand King review required",
    };
  }

  if (failed.length === 1) {
    return {
      decision: "conditionally_approved",
      reasoning: `Conditional approval — resolve: ${failed[0]!.findings.join("; ") || failed[0]!.category}`,
    };
  }

  const enhancementRecs = recommendations.filter(
    (r) => r.kind === "future_enhancement" && !r.blocksApproval,
  );

  if (partial.length > 0 || enhancementRecs.length > 0) {
    return {
      decision: "approved_with_recommendations",
      reasoning:
        partial.length > 0
          ? `Approved with ${partial.length} partially passed categories and ${enhancementRecs.length} enhancement recommendations`
          : `Approved with ${enhancementRecs.length} non-blocking recommendations`,
    };
  }

  return {
    decision: "approved",
    reasoning: "All review categories passed; acceptance criteria verified; no mandatory corrections",
  };
}
