/** E3-13 — Executive Performance Dashboard frontend types (mirrors Pillow PILLOW-EPD-001). */

export type ExecutiveSummary = {
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
  category: string;
  metric: string;
  value: string;
  status: string;
  trend: string;
  confidence: number;
  href: string;
  engineId: string;
};

export type ExecutiveNavigationEntry = {
  target: string;
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
  source: string;
};

export type ConsolidatedRecommendation = {
  id: string;
  title: string;
  source: string;
  category: string;
  priority: string;
  confidencePercent: number;
};

export type ExecutivePerformanceDashboard = {
  engineVersion: string;
  computedAt: string;
  dashboardSummary: string;
  dashboardHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  widgetCount: number;
  realtimePollIntervalMs: number;
  executiveSummary: ExecutiveSummary;
  financialWidgets: FinancialWidget[];
  executiveNavigation: ExecutiveNavigationEntry[];
  pillowPublications: PerformancePublication[];
  eccPublications: PerformancePublication[];
  supervisorPublications: PerformancePublication[];
  consolidatedRecommendations: ConsolidatedRecommendation[];
  realtimeUpdateTriggers: string[];
  dashboardPrinciples: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE314: boolean;
};
