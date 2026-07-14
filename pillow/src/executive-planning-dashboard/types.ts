/** PILLOW-EPD-001 — Executive Planning Dashboard types (E1-14). */

import type {
  DASHBOARD_SECTIONS,
  PLANNING_WIDGET_IDS,
  REAL_TIME_UPDATE_TRIGGERS,
  PILLOW_DASHBOARD_PUBLICATIONS,
  ECC_DASHBOARD_PUBLICATIONS,
  SUPERVISOR_DASHBOARD_PUBLICATIONS,
  EXECUTIVE_NAV_TARGETS,
} from "./paths.js";

export type ExecutivePlanningDashboardVersion = "E1-14";

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];
export type PlanningWidgetId = (typeof PLANNING_WIDGET_IDS)[number];
export type RealTimeUpdateTrigger = (typeof REAL_TIME_UPDATE_TRIGGERS)[number];
export type PillowDashboardPublication = (typeof PILLOW_DASHBOARD_PUBLICATIONS)[number];
export type EccDashboardPublication = (typeof ECC_DASHBOARD_PUBLICATIONS)[number];
export type SupervisorDashboardPublication = (typeof SUPERVISOR_DASHBOARD_PUBLICATIONS)[number];
export type ExecutiveNavTarget = (typeof EXECUTIVE_NAV_TARGETS)[number];

export type ExecutiveSummary = {
  overallPlanningHealth: string;
  overallPlanningScore: number;
  visionAlignment: string;
  programmeProgress: string;
  priorityStatus: string;
  growthReadiness: string;
  executionReadiness: string;
  strategicRisks: string;
  strategicOpportunities: string;
  currentRecommendation: string;
};

export type PlanningWidget = {
  widgetId: PlanningWidgetId;
  title: string;
  engineId: string;
  health: string;
  healthScore: number;
  summary: string;
  keyMetric: string;
  keyValue: string;
  href: string;
  status: string;
};

export type ExecutiveNavigationLink = {
  target: ExecutiveNavTarget;
  label: string;
  href: string;
  description: string;
};

export type DashboardPublication = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ConsolidatedRecommendation = {
  id: string;
  title: string;
  source: string;
  category: string;
  why: string;
  confidencePercent: number;
};

export type ExecutivePlanningDashboard = {
  architectureVersion: ExecutivePlanningDashboardVersion;
  computedAt: string;
  dashboardSummary: string;
  dashboardHealth: string;
  healthScore: number;
  executiveSummary: ExecutiveSummary;
  planningWidgets: PlanningWidget[];
  executiveRecommendations: ConsolidatedRecommendation[];
  pillowPublications: DashboardPublication[];
  eccPublications: DashboardPublication[];
  supervisorPublications: DashboardPublication[];
  navigationLinks: ExecutiveNavigationLink[];
  realTimeUpdateTriggers: RealTimeUpdateTrigger[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE115: boolean;
};
