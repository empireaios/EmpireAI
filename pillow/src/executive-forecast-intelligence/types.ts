/** PILLOW-EFI-001 — Executive Forecast Intelligence types (E3-12). */

import type {
  EXECUTIVE_FORECAST_PIPELINE,
  EXECUTIVE_FORECAST_PRINCIPLES,
  GOVERNED_FORECAST_DOMAINS,
  EXECUTIVE_FORECAST_CLASSIFICATIONS,
  EXECUTIVE_FORECAST_ANALYSIS_DOMAINS,
  PILLOW_FORECAST_EVALUATIONS,
} from "./paths.js";

export type ExecutiveForecastIntelligenceVersion = "E3-12";

export type ExecutiveForecastPipelinePhase = (typeof EXECUTIVE_FORECAST_PIPELINE)[number];
export type ExecutiveForecastPrinciple = (typeof EXECUTIVE_FORECAST_PRINCIPLES)[number];
export type GovernedForecastDomain = (typeof GOVERNED_FORECAST_DOMAINS)[number];
export type ExecutiveForecastClassification = (typeof EXECUTIVE_FORECAST_CLASSIFICATIONS)[number];
export type ExecutiveForecastAnalysisDomain = (typeof EXECUTIVE_FORECAST_ANALYSIS_DOMAINS)[number];
export type PillowForecastEvaluation = (typeof PILLOW_FORECAST_EVALUATIONS)[number];

export type ExecutiveForecastPipelineStep = {
  phase: ExecutiveForecastPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveForecast = {
  forecastId: string;
  title: string;
  category: ExecutiveForecastClassification;
  domain: GovernedForecastDomain;
  businessUnit: string;
  strategicObjective: string;
  forecastPeriod: string;
  projectedRevenue: string;
  projectedCost: string;
  projectedProfit: string;
  projectedCashFlow: string;
  projectedRoi: string;
  forecastConfidence: number;
  riskAdjustment: string;
  businessImpact: string;
  evidence: string[];
  forecastScore: number;
  status: string;
};

export type ExecutiveForecastRevenueEntry = {
  period: string;
  projected: string;
  priorActual: string;
  growth: string;
  confidence: number;
  trend: string;
};

export type ExecutiveForecastProfitEntry = {
  period: string;
  projected: string;
  margin: string;
  priorActual: string;
  growth: string;
  confidence: number;
};

export type ExecutiveForecastCashFlowEntry = {
  period: string;
  inflow: string;
  outflow: string;
  netCashFlow: string;
  endingBalance: string;
  confidence: number;
};

export type ExecutiveForecastGrowthEntry = {
  domain: string;
  currentValue: string;
  projectedValue: string;
  growthRate: string;
  confidence: number;
  horizon: string;
};

export type ForecastAccuracyEntry = {
  forecastId: string;
  title: string;
  period: string;
  projected: string;
  actual: string;
  variance: string;
  accuracyPercent: number;
  status: string;
};

export type FinancialTrendEntry = {
  metric: string;
  current: string;
  trend: string;
  forecast: string;
  direction: string;
  confidence: number;
};

export type StrategicOutlookEntry = {
  domain: string;
  outlook: string;
  horizon: string;
  confidence: number;
  riskFactor: string;
  status: string;
};

export type ExecutiveForecastAnalysisMetric = {
  domain: ExecutiveForecastAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveForecastRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowForecastEvaluationMetric = {
  domain: PillowForecastEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveForecastIntelligence = {
  engineVersion: ExecutiveForecastIntelligenceVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  forecastHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeForecastCount: number;
  averageConfidence: number;
  averageForecastAccuracy: number;
  projectedEnterpriseRevenue: string;
  projectedEnterpriseProfit: string;
  projectedCashPosition: string;
  executiveForecasts: ExecutiveForecast[];
  revenueForecast: ExecutiveForecastRevenueEntry[];
  profitForecast: ExecutiveForecastProfitEntry[];
  cashFlowForecast: ExecutiveForecastCashFlowEntry[];
  growthForecast: ExecutiveForecastGrowthEntry[];
  forecastAccuracy: ForecastAccuracyEntry[];
  financialTrends: FinancialTrendEntry[];
  strategicOutlook: StrategicOutlookEntry[];
  forecastAnalysis: ExecutiveForecastAnalysisMetric[];
  executiveForecastPipeline: ExecutiveForecastPipelineStep[];
  recommendedActions: ExecutiveForecastRecommendation[];
  pillowEvaluations: PillowForecastEvaluationMetric[];
  forecastPrinciples: ExecutiveForecastPrinciple[];
  governedDomains: GovernedForecastDomain[];
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
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE313: boolean;
};
