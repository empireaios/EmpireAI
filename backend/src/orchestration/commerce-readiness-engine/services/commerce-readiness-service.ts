import type {
  CommerceReadinessDashboard,
  CommerceReadinessEvaluation,
  CommerceReadinessSummary,
  LaunchDecision,
  ReadinessBlocker,
} from "../models/commerce-readiness.js";
import {
  evaluateCommerceReadiness,
  type EvaluateCommerceReadinessInput,
} from "./commerce-readiness-evaluator.js";

export type { EvaluateCommerceReadinessInput };

export function getCommerceReadinessEvaluation(input: EvaluateCommerceReadinessInput): CommerceReadinessEvaluation {
  return evaluateCommerceReadiness(input);
}

export function getCommerceReadinessSummary(input: EvaluateCommerceReadinessInput): CommerceReadinessSummary {
  const evaluation = evaluateCommerceReadiness(input);
  return {
    workspaceId: evaluation.workspaceId,
    companyId: evaluation.companyId,
    overallReadinessScore: evaluation.overallReadinessScore,
    launchDecision: evaluation.launchDecision,
    recommendedNextAction: evaluation.recommendedNextAction,
    blockingCount: evaluation.blockers.filter((blocker) => blocker.severity === "BLOCKING").length,
    warningCount: evaluation.blockers.filter((blocker) => blocker.severity === "WARNING").length,
    readyMarketplaceCount: evaluation.readyMarketplaces.length,
    readyProductCount: evaluation.readyProducts.length,
    readyBrandCount: evaluation.readyBrands.length,
    individualReadiness: evaluation.individualReadiness,
    computedAt: evaluation.computedAt,
  };
}

export function getCommerceReadinessBlockers(input: EvaluateCommerceReadinessInput): ReadinessBlocker[] {
  return evaluateCommerceReadiness(input).blockers;
}

export function getCommerceLaunchDecision(input: EvaluateCommerceReadinessInput): {
  launchDecision: LaunchDecision;
  overallReadinessScore: number;
  recommendedNextAction: string;
  blockingCount: number;
  warningCount: number;
} {
  const evaluation = evaluateCommerceReadiness(input);
  return {
    launchDecision: evaluation.launchDecision,
    overallReadinessScore: evaluation.overallReadinessScore,
    recommendedNextAction: evaluation.recommendedNextAction,
    blockingCount: evaluation.blockers.filter((blocker) => blocker.severity === "BLOCKING").length,
    warningCount: evaluation.blockers.filter((blocker) => blocker.severity === "WARNING").length,
  };
}

export function buildCommerceReadinessDashboard(input: EvaluateCommerceReadinessInput): CommerceReadinessDashboard {
  const evaluation = evaluateCommerceReadiness(input);
  return {
    overallReadinessScore: evaluation.overallReadinessScore,
    launchDecision: evaluation.launchDecision,
    recommendedNextAction: evaluation.recommendedNextAction,
    blockingItems: evaluation.blockers.filter((blocker) => blocker.severity === "BLOCKING"),
    readyMarketplaces: evaluation.readyMarketplaces,
    readyProducts: evaluation.readyProducts,
    readyBrands: evaluation.readyBrands,
  };
}
