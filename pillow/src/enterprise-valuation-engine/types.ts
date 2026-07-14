/** PILLOW-EVE-001 — Enterprise Valuation Engine types (E3-14). */

import type {
  ENTERPRISE_VALUATION_PIPELINE,
  ENTERPRISE_VALUATION_PRINCIPLES,
  GOVERNED_VALUATION_DOMAINS,
  ENTERPRISE_VALUATION_CLASSIFICATIONS,
  ENTERPRISE_VALUATION_ANALYSIS_DOMAINS,
  PILLOW_VALUATION_EVALUATIONS,
} from "./paths.js";

export type EnterpriseValuationEngineVersion = "E3-14";

export type EnterpriseValuationPipelinePhase = (typeof ENTERPRISE_VALUATION_PIPELINE)[number];
export type EnterpriseValuationPrinciple = (typeof ENTERPRISE_VALUATION_PRINCIPLES)[number];
export type GovernedValuationDomain = (typeof GOVERNED_VALUATION_DOMAINS)[number];
export type EnterpriseValuationClassification = (typeof ENTERPRISE_VALUATION_CLASSIFICATIONS)[number];
export type EnterpriseValuationAnalysisDomain = (typeof ENTERPRISE_VALUATION_ANALYSIS_DOMAINS)[number];
export type PillowValuationEvaluation = (typeof PILLOW_VALUATION_EVALUATIONS)[number];

export type EnterpriseValuationPipelineStep = {
  phase: EnterpriseValuationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseValuationRecord = {
  valuationId: string;
  title: string;
  category: EnterpriseValuationClassification;
  domain: GovernedValuationDomain;
  businessUnit: string;
  strategicObjective: string;
  valuationDate: string;
  estimatedEnterpriseValue: string;
  revenueContribution: string;
  profitContribution: string;
  assetContribution: string;
  growthContribution: string;
  riskAdjustment: string;
  valuationMethod: string;
  confidence: number;
  evidence: string[];
  valuationScore: number;
  status: string;
};

export type EnterpriseValuationDriverEntry = {
  driverId: string;
  title: string;
  category: string;
  contribution: string;
  impact: string;
  trend: string;
  confidence: number;
  status: string;
};

export type EnterpriseValuationRevenueContributionEntry = {
  domain: string;
  revenue: string;
  contributionPercent: number;
  growthRate: string;
  status: string;
};

export type EnterpriseValuationProfitContributionEntry = {
  domain: string;
  profit: string;
  contributionPercent: number;
  margin: string;
  status: string;
};

export type EnterpriseValuationRiskAdjustmentEntry = {
  factor: string;
  adjustment: string;
  impact: string;
  severity: string;
  status: string;
};

export type EnterpriseValuationGrowthTrendEntry = {
  period: string;
  enterpriseValue: string;
  growthRate: string;
  trend: string;
  confidence: number;
};

export type EnterpriseValuationAnalysisMetric = {
  domain: EnterpriseValuationAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type EnterpriseValuationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowValuationEvaluationMetric = {
  domain: PillowValuationEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type EnterpriseValuationEngine = {
  engineVersion: EnterpriseValuationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  valuationHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeValuationCount: number;
  averageConfidence: number;
  estimatedEnterpriseValue: string;
  businessValue: string;
  growthTrend: string;
  totalRiskAdjustment: string;
  enterpriseValuations: EnterpriseValuationRecord[];
  valuationDrivers: EnterpriseValuationDriverEntry[];
  revenueContribution: EnterpriseValuationRevenueContributionEntry[];
  profitContribution: EnterpriseValuationProfitContributionEntry[];
  riskAdjustments: EnterpriseValuationRiskAdjustmentEntry[];
  growthTrends: EnterpriseValuationGrowthTrendEntry[];
  valuationAnalysis: EnterpriseValuationAnalysisMetric[];
  valuationPipeline: EnterpriseValuationPipelineStep[];
  recommendedActions: EnterpriseValuationRecommendation[];
  pillowEvaluations: PillowValuationEvaluationMetric[];
  valuationPrinciples: EnterpriseValuationPrinciple[];
  governedDomains: GovernedValuationDomain[];
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
    executivePerformanceDashboard: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE315: boolean;
};
