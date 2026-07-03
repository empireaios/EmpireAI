/**
 * G7-04 — Cockpit Grand King Executive Decision Centre backend contracts.
 * Extends G4 Cockpit — backend contracts only, no UI redesign.
 */

import type {
  ExecutiveApprovalSummary,
  ExecutiveBlockerSummary,
  ExecutiveKpiSnapshot,
  ExecutiveNotification,
  ExecutiveOperationsOverview,
  ExecutiveOpportunitySummary,
  ExecutiveRecommendation,
  ExecutiveRiskSummary,
  ExecutiveTimelineEntry,
} from "./executive-decision-types.js";

export const COCKPIT_EXECUTIVE_DECISION_CENTRE_VIEW_ID = "cockpit-grand-king-executive-decision-centre" as const;

export type CockpitExecutiveDecisionCentreView = {
  viewId: typeof COCKPIT_EXECUTIVE_DECISION_CENTRE_VIEW_ID;
  computedAt: string;
  dataMode: "executive";
  executiveDashboard: ExecutiveOperationsOverview;
  empireHealth: Pick<ExecutiveKpiSnapshot, "empireHealthScore" | "riskLevel" | "productionReadiness">;
  decisionQueue: { pendingCount: number; decisions: Array<{ decisionId: string; decisionType: string; status: string }> };
  recommendationCentre: { count: number; recommendations: ExecutiveRecommendation[] };
  operationalTimeline: ExecutiveTimelineEntry[];
  notifications: ExecutiveNotification[];
  blockers: ExecutiveBlockerSummary;
  risks: ExecutiveRiskSummary;
  executiveKpis: ExecutiveKpiSnapshot;
  approvals: ExecutiveApprovalSummary;
  opportunities: ExecutiveOpportunitySummary;
  executiveSummary: string;
  discoverySource: "grand-king-executive-decision-centre:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitExecutiveDecisionCentreView(input: {
  overview: ExecutiveOperationsOverview;
  kpis: ExecutiveKpiSnapshot;
  decisionQueue: CockpitExecutiveDecisionCentreView["decisionQueue"];
  recommendations: ExecutiveRecommendation[];
  timeline: ExecutiveTimelineEntry[];
  notifications: ExecutiveNotification[];
  blockers: ExecutiveBlockerSummary;
  risks: ExecutiveRiskSummary;
  approvals: ExecutiveApprovalSummary;
  opportunities: ExecutiveOpportunitySummary;
  executiveSummary: string;
}): CockpitExecutiveDecisionCentreView {
  return {
    viewId: COCKPIT_EXECUTIVE_DECISION_CENTRE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "executive",
    executiveDashboard: input.overview,
    empireHealth: {
      empireHealthScore: input.kpis.empireHealthScore,
      riskLevel: input.kpis.riskLevel,
      productionReadiness: input.kpis.productionReadiness,
    },
    decisionQueue: input.decisionQueue,
    recommendationCentre: { count: input.recommendations.length, recommendations: input.recommendations },
    operationalTimeline: input.timeline,
    notifications: input.notifications,
    blockers: input.blockers,
    risks: input.risks,
    executiveKpis: input.kpis,
    approvals: input.approvals,
    opportunities: input.opportunities,
    executiveSummary: input.executiveSummary,
    discoverySource: "grand-king-executive-decision-centre:cockpit",
    designLanguage: "g4-cockpit",
  };
}
