/** E3-02 — Capital Allocation Engine frontend types (mirrors Pillow PILLOW-CAE-001). */

export type CapitalAllocation = {
  allocationId: string;
  title: string;
  category: string;
  domain: string;
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
  domain: string;
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
  domain: string;
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

export type CapitalPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type PillowCapitalEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type CapitalAllocationEngine = {
  engineVersion: string;
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
  capitalPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE303: boolean;
};
