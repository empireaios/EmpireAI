/** E1-14 — Executive Planning Dashboard frontend types (mirrors Pillow PILLOW-EPD-001). */

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
  widgetId: string;
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
  target: string;
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
  architectureVersion: string;
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
  realTimeUpdateTriggers: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE115: boolean;
};
