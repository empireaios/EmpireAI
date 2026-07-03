/**
 * G7-06 — Cockpit continuous intelligence backend contracts.
 */

import type {
  OptimizationHistoryEntry,
  OptimizationOperationsOverview,
  OptimizationOpportunity,
  OptimizationPriorityQueueEntry,
  OptimizationRecommendation,
  OptimizationRoiSummary,
} from "./continuous-intelligence-types.js";

export const COCKPIT_CONTINUOUS_INTELLIGENCE_VIEW_ID =
  "cockpit-grand-king-continuous-intelligence-optimization" as const;

export type CockpitContinuousIntelligenceView = {
  viewId: typeof COCKPIT_CONTINUOUS_INTELLIGENCE_VIEW_ID;
  computedAt: string;
  dataMode: "optimization";
  optimizationDashboard: OptimizationOperationsOverview;
  opportunityQueue: { count: number; opportunities: OptimizationOpportunity[] };
  priorityQueue: { count: number; queue: OptimizationPriorityQueueEntry[] };
  roiDashboard: OptimizationRoiSummary;
  optimizationHistory: OptimizationHistoryEntry[];
  recommendations: { count: number; items: OptimizationRecommendation[] };
  executiveOptimizationSummary: string;
  discoverySource: "grand-king-continuous-intelligence-optimization:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitContinuousIntelligenceView(input: {
  overview: OptimizationOperationsOverview;
  opportunities: OptimizationOpportunity[];
  priorityQueue: OptimizationPriorityQueueEntry[];
  roi: OptimizationRoiSummary;
  history: OptimizationHistoryEntry[];
  recommendations: OptimizationRecommendation[];
  executiveOptimizationSummary: string;
}): CockpitContinuousIntelligenceView {
  return {
    viewId: COCKPIT_CONTINUOUS_INTELLIGENCE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "optimization",
    optimizationDashboard: input.overview,
    opportunityQueue: { count: input.opportunities.length, opportunities: input.opportunities },
    priorityQueue: { count: input.priorityQueue.length, queue: input.priorityQueue },
    roiDashboard: input.roi,
    optimizationHistory: input.history,
    recommendations: { count: input.recommendations.length, items: input.recommendations },
    executiveOptimizationSummary: input.executiveOptimizationSummary,
    discoverySource: "grand-king-continuous-intelligence-optimization:cockpit",
    designLanguage: "g4-cockpit",
  };
}
