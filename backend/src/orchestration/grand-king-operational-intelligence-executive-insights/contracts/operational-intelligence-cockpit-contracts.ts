/**
 * G7-09 — Cockpit operational intelligence backend contracts.
 */

import type {
  EmpireHealthScore,
  ExecutiveBriefing,
  ExecutiveInsight,
  ExecutiveKpiSnapshot,
  ExecutiveOpportunity,
  ExecutivePrediction,
  ExecutiveTrend,
  OperationalIntelligenceOverview,
} from "./operational-intelligence-types.js";

export const COCKPIT_OPERATIONAL_INTELLIGENCE_VIEW_ID =
  "cockpit-grand-king-operational-intelligence-executive-insights" as const;

export type CockpitOperationalIntelligenceView = {
  viewId: typeof COCKPIT_OPERATIONAL_INTELLIGENCE_VIEW_ID;
  computedAt: string;
  dataMode: "operational-intelligence";
  executiveIntelligence: { count: number; insights: ExecutiveInsight[] };
  executiveBriefing: ExecutiveBriefing;
  empireHealthScore: EmpireHealthScore;
  trendDashboard: { count: number; trends: ExecutiveTrend[] };
  opportunityDashboard: { count: number; opportunities: ExecutiveOpportunity[] };
  riskDashboard: { count: number; risks: ExecutiveInsight[] };
  predictions: { count: number; predictions: ExecutivePrediction[] };
  recommendations: { count: number; recommendations: ExecutiveInsight[] };
  executiveSummary: string;
  intelligenceOverview: OperationalIntelligenceOverview;
  discoverySource: "grand-king-operational-intelligence-executive-insights:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitOperationalIntelligenceView(input: {
  overview: OperationalIntelligenceOverview;
  insights: ExecutiveInsight[];
  briefing: ExecutiveBriefing;
  empireHealth: EmpireHealthScore;
  trends: ExecutiveTrend[];
  opportunities: ExecutiveOpportunity[];
  risks: ExecutiveInsight[];
  predictions: ExecutivePrediction[];
  recommendations: ExecutiveInsight[];
  executiveSummary: string;
}): CockpitOperationalIntelligenceView {
  return {
    viewId: COCKPIT_OPERATIONAL_INTELLIGENCE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "operational-intelligence",
    executiveIntelligence: { count: input.insights.length, insights: input.insights },
    executiveBriefing: input.briefing,
    empireHealthScore: input.empireHealth,
    trendDashboard: { count: input.trends.length, trends: input.trends },
    opportunityDashboard: { count: input.opportunities.length, opportunities: input.opportunities },
    riskDashboard: { count: input.risks.length, risks: input.risks },
    predictions: { count: input.predictions.length, predictions: input.predictions },
    recommendations: { count: input.recommendations.length, recommendations: input.recommendations },
    executiveSummary: input.executiveSummary,
    intelligenceOverview: input.overview,
    discoverySource: "grand-king-operational-intelligence-executive-insights:cockpit",
    designLanguage: "g4-cockpit",
  };
}
