/**
 * G7-06 — Recommendation prioritiser (registry-driven scoring).
 */

import type { OptimizationPriorityQueueEntry, OptimizationRecommendation } from "../contracts/continuous-intelligence-types.js";
import { deriveSignalFromRuleRef, resolveOptimizationDependencies } from "../registry/continuous-intelligence-registry-resolver.js";

export function prioritiseOptimizationRecommendations(
  recommendations: OptimizationRecommendation[],
): OptimizationPriorityQueueEntry[] {
  const deps = resolveOptimizationDependencies({});

  return recommendations
    .map((rec) => {
      const ruleBoost = deps.prioritizationRuleRefs.reduce(
        (sum, ref) => sum + deriveSignalFromRuleRef(ref),
        0,
      );
      const priorityWeight =
        rec.priority === "critical" ? 4 : rec.priority === "high" ? 3 : rec.priority === "medium" ? 2 : 1;
      const score =
        rec.estimatedBenefit * 0.4 +
        rec.estimatedRevenueImpact * 0.3 -
        rec.estimatedRisk * 0.2 -
        rec.estimatedCost * 0.1 +
        priorityWeight * 10 +
        ruleBoost * 5;

      return {
        queuePosition: 0,
        optimizationId: rec.optimizationId,
        priority: rec.priority,
        optimizationType: rec.optimizationType,
        estimatedBenefit: rec.estimatedBenefit,
        score: Math.round(score * 100) / 100,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, queuePosition: index + 1 }));
}

export function computeOptimizationRoi(recommendations: OptimizationRecommendation[]) {
  const totalEstimatedBenefit = recommendations.reduce((sum, r) => sum + r.estimatedBenefit, 0);
  const totalEstimatedCost = recommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
  const netRoi =
    totalEstimatedCost > 0
      ? ((totalEstimatedBenefit - totalEstimatedCost) / totalEstimatedCost) * 100
      : totalEstimatedBenefit > 0
        ? 100
        : 0;

  return {
    totalEstimatedBenefit: Math.round(totalEstimatedBenefit * 100) / 100,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    netRoi: Math.round(netRoi * 100) / 100,
    recommendationCount: recommendations.length,
    computedAt: new Date().toISOString(),
  };
}
