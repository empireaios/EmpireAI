/** PILLOW-EPD-001 — Executive Performance Dashboard types (E3-13). */

import type {
  EXECUTIVE_PERFORMANCE_WIDGETS,
  EXECUTIVE_PERFORMANCE_PRINCIPLES,
  EXECUTIVE_NAVIGATION_TARGETS,
  PILLOW_PERFORMANCE_PUBLICATIONS,
  ECC_PERFORMANCE_PUBLICATIONS,
  SUPERVISOR_PERFORMANCE_PUBLICATIONS,
  REALTIME_UPDATE_TRIGGERS,
} from "./paths.js";

export type ExecutivePerformanceDashboardVersion = "E3-13";

export type FinancialWidgetCategory = (typeof EXECUTIVE_PERFORMANCE_WIDGETS)[number];
export type ExecutivePerformancePrinciple = (typeof EXECUTIVE_PERFORMANCE_PRINCIPLES)[number];
export type ExecutiveNavigationTarget = (typeof EXECUTIVE_NAVIGATION_TARGETS)[number];
export type PillowPerformancePublication = (typeof PILLOW_PERFORMANCE_PUBLICATIONS)[number];
export type EccPerformancePublication = (typeof ECC_PERFORMANCE_PUBLICATIONS)[number];
export type SupervisorPerformancePublication = (typeof SUPERVISOR_PERFORMANCE_PUBLICATIONS)[number];
export type RealtimeUpdateTrigger = (typeof REALTIME_UPDATE_TRIGGERS)[number];

export type ExecutivePerformanceSummary = {
  overallFinancialHealth: string;
  revenue: string;
  profit: string;
  cashPosition: string;
  roi: string;
  budgetUtilization: string;
  capitalRisk: string;
  forecastOutlook: string;
  financialReadiness: string;
  currentRecommendation: string;
  healthScore: number;
};

export type FinancialWidget = {
  widgetId: string;
  title: string;
  category: FinancialWidgetCategory;
  metric: string;
  value: string;
  status: string;
  trend: string;
  confidence: number;
  href: string;
  engineId: string;
};

export type ExecutiveNavigationEntry = {
  target: ExecutiveNavigationTarget;
  label: string;
  href: string;
  engineId: string;
  status: string;
};

export type PerformancePublication = {
  domain: string;
  label: string;
  status: string;
  summary: string;
  source: "pillow" | "ecc" | "supervisor";
};

export type PerformanceDashboardRecommendation = {
  id: string;
  title: string;
  source: string;
  category: string;
  priority: string;
  confidencePercent: number;
};

export type ExecutivePerformanceDashboard = {
  engineVersion: ExecutivePerformanceDashboardVersion;
  computedAt: string;
  dashboardSummary: string;
  dashboardHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  widgetCount: number;
  realtimePollIntervalMs: number;
  executiveSummary: ExecutivePerformanceSummary;
  financialWidgets: FinancialWidget[];
  executiveNavigation: ExecutiveNavigationEntry[];
  pillowPublications: PerformancePublication[];
  eccPublications: PerformancePublication[];
  supervisorPublications: PerformancePublication[];
  consolidatedRecommendations: PerformanceDashboardRecommendation[];
  realtimeUpdateTriggers: RealtimeUpdateTrigger[];
  dashboardPrinciples: ExecutivePerformancePrinciple[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    roiIntelligenceEngine: string;
    cashReserveIntelligence: string;
    profitOptimizationEngine: string;
    costOptimizationEngine: string;
    financialScenarioEngine: string;
    executiveKpiEngine: string;
    capitalRiskEngine: string;
    executiveForecastIntelligence: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE314: boolean;
};
