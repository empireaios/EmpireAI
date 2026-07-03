/**
 * G7-09 — Grand King Operational Intelligence Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitOperationalIntelligenceView } from "../contracts/operational-intelligence-cockpit-contracts.js";
import {
  getOperationalIntelligenceOverview,
  getOperationalIntelligenceStatus,
  initializeOperationalIntelligence,
  listExecutiveInsights,
  getExecutiveInsight,
} from "../services/grand-king-operational-intelligence-executive-insights-service.js";
import { buildExecutiveIntelligenceDashboard } from "../services/executive-intelligence-dashboard.js";
import { generateExecutiveBriefing, getExecutiveIntelligenceSummary } from "../services/executive-briefing-generator.js";
import { analyseOperationalTrends } from "../services/operational-trend-analyser.js";
import { analyseOpportunities } from "../services/opportunity-analyser.js";
import { generatePredictions } from "../services/prediction-engine.js";
import { generateExecutiveRecommendations } from "../services/executive-recommendation-engine.js";
import { computeEmpireHealthScore } from "../services/executive-kpi-intelligence.js";
import { listInsightsByCategory } from "../services/insight-store.js";
import { resolveOperationalIntelligenceDependencies } from "../registry/operational-intelligence-registry-resolver.js";

export const grandKingOperationalIntelligenceTools: RegisteredTool[] = [
  {
    name: "executive_intelligence",
    description: "G7-09 — Executive operational intelligence overview and Cockpit view",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getOperationalIntelligenceOverview();
      const dashboard = buildExecutiveIntelligenceDashboard();
      const summary = getExecutiveIntelligenceSummary();
      return {
        overview,
        cockpitView: buildCockpitOperationalIntelligenceView({
          overview,
          insights: dashboard.insights,
          briefing: dashboard.briefing,
          empireHealth: dashboard.empireHealth,
          trends: dashboard.trends,
          opportunities: dashboard.opportunities,
          risks: dashboard.risks,
          predictions: dashboard.predictions,
          recommendations: dashboard.recommendations,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "executive_insights",
    description: "G7-09 — Executive insights",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { insightId: { type: "string" } },
    },
    handler: async (args) => {
      if (args.insightId) {
        const insight = getExecutiveInsight(String(args.insightId));
        return insight ? { insight } : { error: "Insight not found" };
      }
      return { insights: listExecutiveInsights() };
    },
  },
  {
    name: "executive_predictions",
    description: "G7-09 — Executive predictions",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ predictions: generatePredictions() }),
  },
  {
    name: "executive_trends",
    description: "G7-09 — Executive operational trends",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ trends: analyseOperationalTrends() }),
  },
  {
    name: "executive_opportunities",
    description: "G7-09 — Executive opportunities",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ opportunities: analyseOpportunities() }),
  },
  {
    name: "executive_risks",
    description: "G7-09 — Executive risk insights",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ risks: listInsightsByCategory("risk") }),
  },
  {
    name: "executive_briefing",
    description: "G7-09 — Executive intelligence briefing",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ briefing: generateExecutiveBriefing() }),
  },
  {
    name: "empire_health_score",
    description: "G7-09 — Empire health score",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ empireHealthScore: computeEmpireHealthScore() }),
  },
  {
    name: "initialize_grand_king_operational_intelligence",
    description: "G7-09 — Initialize operational intelligence",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeOperationalIntelligence(),
  },
  {
    name: "executive_intelligence_status",
    description: "G7-09 — Operational intelligence framework status",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getOperationalIntelligenceStatus(),
  },
  {
    name: "executive_recommendations",
    description: "G7-09 — Executive recommendations",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      recommendations: generateExecutiveRecommendations(),
    }),
  },
  {
    name: "operational_intelligence_dependencies",
    description: "G7-09 — Operational intelligence registry dependencies",
    module: "grand-king-operational-intelligence-executive-insights",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveOperationalIntelligenceDependencies(),
  },
];
