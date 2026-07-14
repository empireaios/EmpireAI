/** PILLOW-CAE-001 — Capital Allocation Engine types (E3-02). */

import type {
  CAPITAL_PIPELINE,
  CAPITAL_PRINCIPLES,
  GOVERNED_CAPITAL_DOMAINS,
  CAPITAL_CLASSIFICATIONS,
  CAPITAL_OPTIMIZATION_DOMAINS,
  PILLOW_CAPITAL_EVALUATIONS,
} from "./paths.js";

export type CapitalAllocationEngineVersion = "E3-02";

export type CapitalPipelinePhase = (typeof CAPITAL_PIPELINE)[number];
export type CapitalPrinciple = (typeof CAPITAL_PRINCIPLES)[number];
export type GovernedCapitalDomain = (typeof GOVERNED_CAPITAL_DOMAINS)[number];
export type CapitalClassification = (typeof CAPITAL_CLASSIFICATIONS)[number];
export type CapitalOptimizationDomain = (typeof CAPITAL_OPTIMIZATION_DOMAINS)[number];
export type PillowCapitalEvaluation = (typeof PILLOW_CAPITAL_EVALUATIONS)[number];

export type CapitalPipelineStep = {
  phase: CapitalPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type CapitalAllocation = {
  allocationId: string;
  title: string;
  category: CapitalClassification;
  domain: GovernedCapitalDomain;
  purpose: string;
  owner: string;
  businessUnit: string;
  strategicObjective: string;
  allocatedCapital: string;
  expectedRoi: string;
  expectedRevenue: string;
  expectedCost: string;
  expectedProfit: string;
  riskAssessment: string;
  investmentHorizon: string;
  confidence: number;
  evidence: string[];
  status: string;
  utilization: number;
  performanceTrend: string;
};

export type CapitalPortfolioEntry = {
  allocationId: string;
  title: string;
  category: string;
  allocatedCapital: string;
  expectedRoi: string;
  utilization: number;
  status: string;
  strategicAlignment: string;
};

export type CapitalUtilizationMetric = {
  domain: GovernedCapitalDomain;
  label: string;
  allocated: string;
  utilized: number;
  efficiency: string;
  status: string;
};

export type InvestmentPerformanceEntry = {
  allocationId: string;
  title: string;
  expectedRoi: string;
  actualRoi: string;
  performance: string;
  trend: string;
  status: string;
};

export type CapitalRiskEntry = {
  riskId: string;
  allocationId: string;
  title: string;
  severity: string;
  exposure: string;
  mitigation: string;
  status: string;
};

export type StrategicAlignmentEntry = {
  allocationId: string;
  title: string;
  objective: string;
  alignmentScore: number;
  status: string;
  evidence: string;
};

export type CapitalOptimizationMetric = {
  domain: CapitalOptimizationDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type CapitalAllocationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowCapitalEvaluationMetric = {
  domain: PillowCapitalEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type CapitalAllocationEngine = {
  engineVersion: CapitalAllocationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  capitalHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeAllocationCount: number;
  totalCapitalDeployed: string;
  totalCapitalAvailable: string;
  averageExpectedRoi: number;
  averageUtilization: number;
  capitalPortfolio: CapitalPortfolioEntry[];
  currentAllocations: CapitalAllocation[];
  capitalUtilization: CapitalUtilizationMetric[];
  investmentPerformance: InvestmentPerformanceEntry[];
  capitalRisks: CapitalRiskEntry[];
  capitalStrategicAlignment: StrategicAlignmentEntry[];
  capitalOptimization: CapitalOptimizationMetric[];
  capitalPipeline: CapitalPipelineStep[];
  recommendedActions: CapitalAllocationRecommendation[];
  pillowEvaluations: PillowCapitalEvaluationMetric[];
  capitalPrinciples: CapitalPrinciple[];
  governedDomains: GovernedCapitalDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveFinanceFramework: string;
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    executiveRecommendationEngine: string;
    corporateVisionEngine: string;
    guardianStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE303: boolean;
};
