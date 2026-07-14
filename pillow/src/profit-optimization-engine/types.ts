/** PILLOW-POE-001 — Profit Optimization Engine types (E3-07). */

import type {
  PROFIT_OPTIMIZATION_PIPELINE,
  PROFIT_PRINCIPLES,
  GOVERNED_PROFIT_DOMAINS,
  PROFIT_CLASSIFICATIONS,
  PROFIT_ANALYSIS_DOMAINS,
  OPTIMIZATION_CAPABILITIES,
  PILLOW_PROFIT_EVALUATIONS,
} from "./paths.js";

export type ProfitOptimizationEngineVersion = "E3-07";

export type ProfitOptimizationPipelinePhase = (typeof PROFIT_OPTIMIZATION_PIPELINE)[number];
export type ProfitPrinciple = (typeof PROFIT_PRINCIPLES)[number];
export type GovernedProfitDomain = (typeof GOVERNED_PROFIT_DOMAINS)[number];
export type ProfitClassification = (typeof PROFIT_CLASSIFICATIONS)[number];
export type ProfitAnalysisDomain = (typeof PROFIT_ANALYSIS_DOMAINS)[number];
export type OptimizationCapability = (typeof OPTIMIZATION_CAPABILITIES)[number];
export type PillowProfitEvaluation = (typeof PILLOW_PROFIT_EVALUATIONS)[number];

export type ProfitOptimizationPipelineStep = {
  phase: ProfitOptimizationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ProfitAssessment = {
  profitId: string;
  title: string;
  category: ProfitClassification;
  domain: GovernedProfitDomain;
  businessUnit: string;
  strategicObjective: string;
  revenue: string;
  directCost: string;
  indirectCost: string;
  grossProfit: string;
  netProfit: string;
  profitMargin: number;
  expectedGrowth: string;
  optimizationOpportunity: string;
  confidence: number;
  evidence: string[];
  trend: "rising" | "stable" | "declining";
  status: string;
};

export type EnterpriseProfitEntry = {
  profitId: string;
  title: string;
  category: string;
  netProfit: string;
  profitMargin: number;
  expectedGrowth: string;
  trend: string;
  status: string;
};

export type ProfitTrendEntry = {
  period: string;
  enterpriseProfit: string;
  netMargin: number;
  grossMargin: number;
  trend: string;
};

export type OptimizationOpportunityEntry = {
  opportunityId: string;
  title: string;
  capability: string;
  impact: string;
  estimatedGain: string;
  priority: string;
  status: string;
};

export type ProfitRiskEntry = {
  riskId: string;
  profitId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type ProfitAnalysisMetric = {
  domain: ProfitAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type FinancialPerformanceEntry = {
  metric: string;
  value: string;
  trend: string;
  status: string;
};

export type ProfitOptimizationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowProfitEvaluationMetric = {
  domain: PillowProfitEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ProfitOptimizationEngine = {
  engineVersion: ProfitOptimizationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  profitHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeProfitAssessmentCount: number;
  totalEnterpriseProfit: string;
  totalNetProfit: string;
  grossMarginPercentage: number;
  netMarginPercentage: number;
  operatingMarginPercentage: number;
  profitGrowthRate: number;
  enterpriseProfit: EnterpriseProfitEntry[];
  profitAssessments: ProfitAssessment[];
  profitTrends: ProfitTrendEntry[];
  optimizationOpportunities: OptimizationOpportunityEntry[];
  profitRisks: ProfitRiskEntry[];
  profitAnalysis: ProfitAnalysisMetric[];
  financialPerformance: FinancialPerformanceEntry[];
  profitOptimizationPipeline: ProfitOptimizationPipelineStep[];
  recommendedActions: ProfitOptimizationRecommendation[];
  pillowEvaluations: PillowProfitEvaluationMetric[];
  profitPrinciples: ProfitPrinciple[];
  governedDomains: GovernedProfitDomain[];
  optimizationCapabilities: OptimizationCapability[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    roiIntelligenceEngine: string;
    cashReserveIntelligence: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE308: boolean;
};
