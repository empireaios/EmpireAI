/** PILLOW-GKEC-001 — Grand King Executive Cockpit types (E5-15). */

import type {
  EXECUTIVE_DASHBOARD_PIPELINE,
  EXECUTIVE_COCKPIT_PRINCIPLES,
  GOVERNED_EXECUTIVE_DISPLAY_DOMAINS,
  EXECUTIVE_MODULE_CATEGORIES,
  EXECUTIVE_ANALYSIS_DOMAINS,
  PILLOW_COCKPIT_PUBLICATIONS,
} from "./paths.js";

export type GrandKingExecutiveCockpitVersion = "E5-15";

export type ExecutiveDashboardPipelinePhase = (typeof EXECUTIVE_DASHBOARD_PIPELINE)[number];
export type ExecutiveCockpitPrinciple = (typeof EXECUTIVE_COCKPIT_PRINCIPLES)[number];
export type GovernedExecutiveDisplayDomain = (typeof GOVERNED_EXECUTIVE_DISPLAY_DOMAINS)[number];
export type ExecutiveModuleCategory = (typeof EXECUTIVE_MODULE_CATEGORIES)[number];
export type ExecutiveAnalysisDomain = (typeof EXECUTIVE_ANALYSIS_DOMAINS)[number];
export type PillowCockpitPublication = (typeof PILLOW_COCKPIT_PUBLICATIONS)[number];

export type ExecutiveDashboardWidget = {
  widgetId: string;
  widgetName: string;
  executiveCategory: GovernedExecutiveDisplayDomain;
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

export type ExecutiveDashboardAnalysisMetric = {
  domain: ExecutiveAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveCockpitRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveDashboardPipelineStep = {
  phase: ExecutiveDashboardPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PillowCockpitPublicationMetric = {
  domain: PillowCockpitPublication;
  label: string;
  status: string;
  summary: string;
};

export type CockpitMonitoringStatus = {
  backgroundMonitoring: string;
  totalWidgets: number;
  healthyWidgets: number;
  staleWidgets: number;
  cockpitHealthScore: number;
  lastRefreshAt: string;
  nextRefreshAt: string;
};

export type CockpitExecutiveReport = {
  currentStatus: string;
  sovereignHealthScore: number;
  governanceChainScore: number;
  unifiedVisibilityScore: number;
  executiveSummary: string;
  generatedAt: string;
};

export type CockpitMetrics = {
  totalWidgets: number;
  governanceEnginesActive: number;
  governanceEnginesTotal: number;
  averageWidgetConfidence: number;
  enterpriseHealthScore: number;
  unifiedVisibilityScore: number;
};

export type CockpitHealthStatus = {
  status: string;
  healthScore: number;
  widgetCount: number;
  governanceChainComplete: boolean;
  auditEventCount: number;
  lastEventAt: string | null;
};

export type CockpitAuditLogEntry = {
  auditId: string;
  widgetId: string;
  event: string;
  actor: string;
  previousStatus: string;
  newStatus: string;
  details: string;
  timestamp: string;
};

export type GrandKingExecutiveCockpit = {
  engineVersion: GrandKingExecutiveCockpitVersion;
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
  executiveDashboardAnalysis: ExecutiveDashboardAnalysisMetric[];
  executiveDashboardPipeline: ExecutiveDashboardPipelineStep[];
  recommendedActions: ExecutiveCockpitRecommendation[];
  pillowPublications: PillowCockpitPublicationMetric[];
  executivePrinciples: ExecutiveCockpitPrinciple[];
  governedDisplayDomains: GovernedExecutiveDisplayDomain[];
  executiveModuleCategories: ExecutiveModuleCategory[];
  pillowAdvisory: string[];
  integrations: {
    enterpriseGovernanceFramework: string;
    executiveConstitutionalMonitor: string;
    enterpriseAuditEngine: string;
    executiveComplianceEngine: string;
    executiveEthicsEngine: string;
    executiveAccountabilityEngine: string;
    executiveTransparencyEngine: string;
    executiveExceptionManager: string;
    enterpriseRiskGovernance: string;
    executiveReviewBoard: string;
    executivePolicyEvolution: string;
    executiveTrustEngine: string;
    enterpriseConstitutionalGuardian: string;
    executiveResilienceEngine: string;
    executiveIntelligenceProgramme: string;
    executiveDecisionEngine: string;
    financialExecutiveProgramme: string;
    grandKingOperatingAccount: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  cockpitAuditHistory: CockpitAuditLogEntry[];
  monitoringStatus: CockpitMonitoringStatus;
  executiveReport: CockpitExecutiveReport;
  metrics: CockpitMetrics;
  healthStatus: CockpitHealthStatus;
  readyForE516: boolean;
};
