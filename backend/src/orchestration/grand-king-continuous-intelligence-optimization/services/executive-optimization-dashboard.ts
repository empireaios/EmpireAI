/**
 * G7-06 — Executive optimization dashboard backend.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { OptimizationOpportunity } from "../contracts/continuous-intelligence-types.js";
import { prioritiseOptimizationRecommendations, computeOptimizationRoi } from "./recommendation-prioritiser.js";
import { detectOptimizationOpportunities } from "./opportunity-detector.js";
import { listOptimizationHistory } from "./optimization-scheduler.js";
import { listOptimizationRecommendations } from "./optimization-store.js";
import { getOptimizationOperationsOverview } from "./grand-king-continuous-intelligence-optimization-service.js";

export function buildExecutiveOptimizationDashboard(context: RegistryLoaderContext = {}) {
  const overview = getOptimizationOperationsOverview(context);
  const recommendations = listOptimizationRecommendations();
  const opportunities = detectOptimizationOpportunities(context);
  const priorityQueue = prioritiseOptimizationRecommendations(recommendations);
  const roi = computeOptimizationRoi(recommendations);
  const history = listOptimizationHistory();

  return {
    overview,
    recommendations,
    opportunities,
    priorityQueue,
    roi,
    history,
    domains: 12,
    computedAt: new Date().toISOString(),
  };
}

export function getExecutiveOptimizationSummary(context: RegistryLoaderContext = {}): string {
  const dashboard = buildExecutiveOptimizationDashboard(context);
  return [
    `Grand King continuous intelligence — ${dashboard.recommendations.length} active recommendations.`,
    `${dashboard.opportunities.length} opportunities detected, ${dashboard.priorityQueue.length} queued by priority.`,
    `Estimated net ROI ${dashboard.roi.netRoi}%, ${dashboard.overview.completedOptimizations} completed.`,
  ].join(" ");
}

export function listOptimizationOpportunities(context: RegistryLoaderContext = {}): OptimizationOpportunity[] {
  return detectOptimizationOpportunities(context);
}
