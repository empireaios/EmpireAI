/**
 * G7-08 — Executive healing dashboard backend.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { detectHealthDegradation, computeOverallHealth } from "./health-degradation-detector.js";
import { generateHealingRecommendations } from "./healing-recommendation-engine.js";
import {
  buildHealingQueue,
  computeRecoveryConfidenceSummary,
  computeSelfHealingStatistics,
  getActiveRecoveries,
} from "./healing-execution-monitor.js";
import { listHealingActions, listHealingHistory } from "./healing-action-store.js";
import { getSelfHealingOverview } from "./grand-king-self-healing-operations-service.js";

export function buildExecutiveHealingDashboard(context: RegistryLoaderContext = {}) {
  const overview = getSelfHealingOverview(context);
  const recommendations = generateHealingRecommendations(context);
  const degradations = detectHealthDegradation(context);
  const queue = buildHealingQueue();
  const confidence = computeRecoveryConfidenceSummary(listHealingActions());
  const statistics = computeSelfHealingStatistics();
  const activeRecoveries = getActiveRecoveries();
  const history = listHealingHistory();

  return {
    overview,
    recommendations,
    degradations,
    queue,
    confidence,
    statistics,
    activeRecoveries,
    history,
    overallHealth: computeOverallHealth(degradations),
    domains: 12,
    computedAt: new Date().toISOString(),
  };
}

export function getExecutiveSelfHealingSummary(context: RegistryLoaderContext = {}): string {
  const dashboard = buildExecutiveHealingDashboard(context);
  return [
    `Grand King self-healing — ${dashboard.overview.activeHealings} active, ${dashboard.overview.completedHealings} completed.`,
    `Overall health: ${dashboard.overview.overallHealth}. ${dashboard.recommendations.length} healing recommendations.`,
    `Average recovery confidence ${dashboard.confidence.averageConfidence}%, success rate ${dashboard.statistics.successRate}%.`,
  ].join(" ");
}
