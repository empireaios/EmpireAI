/** PILLOW-COE-001 — Cost Optimization Engine types (E3-08). */

import type {
  COST_OPTIMIZATION_PIPELINE,
  COST_PRINCIPLES,
  GOVERNED_COST_DOMAINS,
  COST_CLASSIFICATIONS,
  COST_ANALYSIS_DOMAINS,
  COST_OPTIMIZATION_CAPABILITIES,
  PILLOW_COST_EVALUATIONS,
} from "./paths.js";

export type CostOptimizationEngineVersion = "E3-08";

export type CostOptimizationPipelinePhase = (typeof COST_OPTIMIZATION_PIPELINE)[number];
export type CostPrinciple = (typeof COST_PRINCIPLES)[number];
export type GovernedCostDomain = (typeof GOVERNED_COST_DOMAINS)[number];
export type CostClassification = (typeof COST_CLASSIFICATIONS)[number];
export type CostAnalysisDomain = (typeof COST_ANALYSIS_DOMAINS)[number];
export type CostOptimizationCapability = (typeof COST_OPTIMIZATION_CAPABILITIES)[number];
export type PillowCostEvaluation = (typeof PILLOW_COST_EVALUATIONS)[number];

export type CostOptimizationPipelineStep = {
  phase: CostOptimizationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CostAssessment = {
  costId: string;
  title: string;
  category: CostClassification;
  domain: GovernedCostDomain;
  businessUnit: string;
  strategicObjective: string;
  currentCost: string;
  expectedCost: string;
  costVariance: string;
  savingsOpportunity: string;
  businessImpact: string;
  strategicImpact: string;
  riskAssessment: string;
  optimizationPotential: number;
  confidence: number;
  evidence: string[];
  trend: "rising" | "stable" | "declining";
  status: string;
};

export type EnterpriseCostEntry = {
  costId: string;
  title: string;
  category: string;
  currentCost: string;
  costVariance: string;
  savingsOpportunity: string;
  optimizationPotential: number;
  status: string;
};

export type CostBreakdownEntry = {
  domain: string;
  label: string;
  currentCost: string;
  percentage: number;
  trend: string;
  status: string;
};

export type CostTrendEntry = {
  period: string;
  enterpriseCost: string;
  costEfficiency: number;
  savingsAchieved: string;
  trend: string;
};

export type SavingsOpportunityEntry = {
  opportunityId: string;
  title: string;
  capability: string;
  estimatedSavings: string;
  businessImpact: string;
  priority: string;
  status: string;
};

export type EfficiencyMetricEntry = {
  metric: string;
  value: string;
  score: number;
  status: string;
  trend: string;
};

export type WasteDetectionEntry = {
  wasteId: string;
  costId: string;
  title: string;
  severity: string;
  exposure: string;
  elimination: string;
  status: string;
};

export type CostAnalysisMetric = {
  domain: CostAnalysisDomain;
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

export type CostOptimizationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCostEvaluationMetric = {
  domain: PillowCostEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CostOptimizationEngine = {
  engineVersion: CostOptimizationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  costHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeCostAssessmentCount: number;
  totalEnterpriseCost: string;
  totalSavingsIdentified: string;
  averageCostEfficiency: number;
  averageOptimizationPotential: number;
  wasteItemsDetected: number;
  costAssessments: CostAssessment[];
  enterpriseCosts: EnterpriseCostEntry[];
  costBreakdown: CostBreakdownEntry[];
  costTrends: CostTrendEntry[];
  savingsOpportunities: SavingsOpportunityEntry[];
  efficiencyMetrics: EfficiencyMetricEntry[];
  wasteDetection: WasteDetectionEntry[];
  costAnalysis: CostAnalysisMetric[];
  financialPerformance: FinancialPerformanceEntry[];
  costOptimizationPipeline: CostOptimizationPipelineStep[];
  recommendedActions: CostOptimizationRecommendation[];
  pillowEvaluations: PillowCostEvaluationMetric[];
  costPrinciples: CostPrinciple[];
  governedDomains: GovernedCostDomain[];
  optimizationCapabilities: CostOptimizationCapability[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    capitalAllocationEngine: string;
    executiveBudgetPlanner: string;
    investmentEvaluationEngine: string;
    roiIntelligenceEngine: string;
    cashReserveIntelligence: string;
    profitOptimizationEngine: string;
    executiveDecisionArchitecture: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE309: boolean;
};
