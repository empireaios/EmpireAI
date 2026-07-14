/** E5-15 — Grand King Executive Cockpit frontend types (mirrors Pillow PILLOW-GKEC-001). */

export type ExecutiveDashboardWidget = {
  widgetId: string;
  widgetName: string;
  executiveCategory: string;
  primaryMetric: string;
  healthStatus: string;
  businessImpact: string;
  strategicImpact: string;
  dataSource: string;
  lastUpdated: string;
  confidence: number;
  evidence: string[];
};

export type GovernanceChainEntry = {
  chainId: string;
  missionId: string;
  engineName: string;
  healthScore: number;
  healthStatus: string;
  primaryMetric: string;
  route: string;
  integrationStatus: string;
  lastUpdated: string;
};

export type GrandKingExecutiveCockpit = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  cockpitHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  sovereignHealthScore: number;
  governanceChainScore: number;
  unifiedVisibilityScore: number;
  totalWidgetCount: number;
  healthyWidgetCount: number;
  governanceEnginesActive: number;
  governanceEnginesTotal: number;
  executiveDashboardWidgets: ExecutiveDashboardWidget[];
  governanceChain: GovernanceChainEntry[];
  executiveDashboardAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  executiveDashboardPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  recommendedActions: Array<{ id: string; title: string; category: string; why: string; what: string; how: string; confidencePercent: number }>;
  pillowPublications: Array<{ domain: string; label: string; status: string; summary: string }>;
  executivePrinciples: string[];
  governedDisplayDomains: string[];
  executiveModuleCategories: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  monitoringStatus: {
    backgroundMonitoring: string;
    totalWidgets: number;
    healthyWidgets: number;
    staleWidgets: number;
    cockpitHealthScore: number;
    lastRefreshAt: string;
    nextRefreshAt: string;
  };
  executiveReport: {
    currentStatus: string;
    sovereignHealthScore: number;
    governanceChainScore: number;
    unifiedVisibilityScore: number;
    executiveSummary: string;
    generatedAt: string;
  };
  metrics: {
    totalWidgets: number;
    governanceEnginesActive: number;
    governanceEnginesTotal: number;
    averageWidgetConfidence: number;
    enterpriseHealthScore: number;
    unifiedVisibilityScore: number;
  };
  healthStatus: {
    status: string;
    healthScore: number;
    widgetCount: number;
    governanceChainComplete: boolean;
    auditEventCount: number;
    lastEventAt: string | null;
  };
  readyForE516: boolean;
};
