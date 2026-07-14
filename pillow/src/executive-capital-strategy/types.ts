/** PILLOW-ECS-001 — Executive Capital Strategy types (E3-15). */

import type {
  EXECUTIVE_CAPITAL_STRATEGY_PIPELINE,
  EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES,
  GOVERNED_CAPITAL_STRATEGY_DOMAINS,
  CAPITAL_STRATEGY_CLASSIFICATIONS,
  CAPITAL_STRATEGY_ANALYSIS_DOMAINS,
  INVESTMENT_HORIZONS,
  PRESERVATION_GROWTH_BANDS,
  PILLOW_CAPITAL_STRATEGY_EVALUATIONS,
} from "./paths.js";

export type ExecutiveCapitalStrategyVersion = "E3-15";

export type ExecutiveCapitalStrategyPipelinePhase =
  (typeof EXECUTIVE_CAPITAL_STRATEGY_PIPELINE)[number];
export type ExecutiveCapitalStrategyPrinciple =
  (typeof EXECUTIVE_CAPITAL_STRATEGY_PRINCIPLES)[number];
export type GovernedCapitalStrategyDomain =
  (typeof GOVERNED_CAPITAL_STRATEGY_DOMAINS)[number];
export type CapitalStrategyClassification =
  (typeof CAPITAL_STRATEGY_CLASSIFICATIONS)[number];
export type CapitalStrategyAnalysisDomain =
  (typeof CAPITAL_STRATEGY_ANALYSIS_DOMAINS)[number];
export type ExecutiveCapitalInvestmentHorizon = (typeof INVESTMENT_HORIZONS)[number];
export type ExecutiveCapitalPreservationGrowthBand =
  (typeof PRESERVATION_GROWTH_BANDS)[number];
export type PillowCapitalStrategyEvaluation =
  (typeof PILLOW_CAPITAL_STRATEGY_EVALUATIONS)[number];

export type ExecutiveCapitalStrategyPipelineStep = {
  phase: ExecutiveCapitalStrategyPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveCapitalStrategyEntry = {
  strategyId: string;
  title: string;
  category: CapitalStrategyClassification;
  domain: GovernedCapitalStrategyDomain;
  businessUnit: string;
  strategicObjective: string;
  horizon: ExecutiveCapitalInvestmentHorizon;
  capitalAllocation: string;
  preservationWeight: number;
  growthWeight: number;
  expectedReturn: string;
  riskAdjustment: string;
  deploymentPriority: string;
  confidence: number;
  evidence: string[];
  strategyScore: number;
  status: string;
};

export type ExecutiveCapitalAllocationPriority = {
  priorityId: string;
  title: string;
  category: string;
  domain: string;
  capitalAmount: string;
  allocationPercent: number;
  priorityRank: number;
  horizon: ExecutiveCapitalInvestmentHorizon;
  rationale: string;
  status: string;
};

export type ExecutiveCapitalInvestmentHorizonEntry = {
  horizon: ExecutiveCapitalInvestmentHorizon;
  label: string;
  capitalAllocated: string;
  investmentCount: number;
  expectedReturn: string;
  riskLevel: string;
  status: string;
};

export type ExecutiveCapitalPreservationGrowthEntry = {
  band: ExecutiveCapitalPreservationGrowthBand;
  label: string;
  preservationPercent: number;
  growthPercent: number;
  capitalPreserved: string;
  capitalDeployed: string;
  rationale: string;
  status: string;
};

export type ExecutiveCapitalStrategicDeploymentEntry = {
  deploymentId: string;
  title: string;
  category: string;
  capitalRequired: string;
  deploymentPhase: string;
  expectedValue: string;
  roiProjection: string;
  riskLevel: string;
  priority: string;
  status: string;
};

export type ExecutiveCapitalStrategyAnalysisMetric = {
  domain: CapitalStrategyAnalysisDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type ExecutiveCapitalStrategyRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCapitalStrategyEvaluationMetric = {
  domain: PillowCapitalStrategyEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveCapitalStrategySummary = {
  longTermStrategy: string;
  preservationGrowthBalance: ExecutiveCapitalPreservationGrowthBand;
  totalCapitalUnderStrategy: string;
  enterpriseValueAnchor: string;
  liquidityCoverage: string;
  strategicDeploymentReadiness: string;
  topPriority: string;
  healthScore: number;
};

export type ExecutiveCapitalStrategy = {
  engineVersion: ExecutiveCapitalStrategyVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  strategyHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeStrategyCount: number;
  averageConfidence: number;
  preservationGrowthBand: ExecutiveCapitalPreservationGrowthBand;
  totalCapitalUnderStrategy: string;
  enterpriseValueAnchor: string;
  strategySummary: ExecutiveCapitalStrategySummary;
  capitalStrategies: ExecutiveCapitalStrategyEntry[];
  allocationPriorities: ExecutiveCapitalAllocationPriority[];
  investmentHorizons: ExecutiveCapitalInvestmentHorizonEntry[];
  preservationGrowthProfiles: ExecutiveCapitalPreservationGrowthEntry[];
  strategicDeployments: ExecutiveCapitalStrategicDeploymentEntry[];
  strategyAnalysis: ExecutiveCapitalStrategyAnalysisMetric[];
  capitalStrategyPipeline: ExecutiveCapitalStrategyPipelineStep[];
  recommendedActions: ExecutiveCapitalStrategyRecommendation[];
  pillowEvaluations: PillowCapitalStrategyEvaluationMetric[];
  strategyPrinciples: ExecutiveCapitalStrategyPrinciple[];
  governedDomains: GovernedCapitalStrategyDomain[];
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
    enterpriseValuationEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE316: boolean;
};
