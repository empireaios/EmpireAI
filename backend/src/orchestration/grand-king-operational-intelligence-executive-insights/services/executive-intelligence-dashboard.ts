/**
 * G7-09 — Executive intelligence dashboard backend.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listExecutiveInsights, listInsightsByCategory } from "./insight-store.js";
import { analyseOperationalTrends } from "./operational-trend-analyser.js";
import { analyseOpportunities } from "./opportunity-analyser.js";
import { generatePredictions } from "./prediction-engine.js";
import { computeEmpireHealthScore, computeExecutiveKpiSnapshots } from "./executive-kpi-intelligence.js";
import { generateExecutiveBriefing } from "./executive-briefing-generator.js";

export function buildExecutiveIntelligenceDashboard(context: RegistryLoaderContext = {}) {
  return {
    insights: listExecutiveInsights(),
    trends: analyseOperationalTrends(context),
    opportunities: analyseOpportunities(context),
    risks: listInsightsByCategory("risk"),
    predictions: generatePredictions(context),
    recommendations: listInsightsByCategory("recommendation"),
    kpis: computeExecutiveKpiSnapshots(context),
    empireHealth: computeEmpireHealthScore(context),
    briefing: generateExecutiveBriefing(context),
  };
}
