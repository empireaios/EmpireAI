/** E3-15 — Executive Capital Strategy frontend types (mirrors Pillow PILLOW-ECS-001). */

export type ExecutiveCapitalStrategyEntry = {
  strategyId: string;
  title: string;
  category: string;
  domain: string;
  businessUnit: string;
  strategicObjective: string;
  horizon: string;
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
  horizon: string;
  rationale: string;
  status: string;
};

export type ExecutiveCapitalInvestmentHorizonEntry = {
  horizon: string;
  label: string;
  capitalAllocated: string;
  investmentCount: number;
  expectedReturn: string;
  riskLevel: string;
  status: string;
};

export type ExecutiveCapitalPreservationGrowthEntry = {
  band: string;
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

export type ExecutiveCapitalStrategyRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveCapitalStrategySummary = {
  longTermStrategy: string;
  preservationGrowthBalance: string;
  totalCapitalUnderStrategy: string;
  enterpriseValueAnchor: string;
  liquidityCoverage: string;
  strategicDeploymentReadiness: string;
  topPriority: string;
  healthScore: number;
};

export type ExecutiveCapitalStrategy = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  strategyHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeStrategyCount: number;
  averageConfidence: number;
  preservationGrowthBand: string;
  totalCapitalUnderStrategy: string;
  enterpriseValueAnchor: string;
  strategySummary: ExecutiveCapitalStrategySummary;
  capitalStrategies: ExecutiveCapitalStrategyEntry[];
  allocationPriorities: ExecutiveCapitalAllocationPriority[];
  investmentHorizons: ExecutiveCapitalInvestmentHorizonEntry[];
  preservationGrowthProfiles: ExecutiveCapitalPreservationGrowthEntry[];
  strategicDeployments: ExecutiveCapitalStrategicDeploymentEntry[];
  strategyAnalysis: Array<{ domain: string; label: string; score: number; status: string; summary: string }>;
  capitalStrategyPipeline: Array<{ phase: string; label: string; order: number; status: string }>;
  pillowEvaluations: Array<{ domain: string; label: string; status: string; summary: string }>;
  recommendedActions: ExecutiveCapitalStrategyRecommendation[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE316: boolean;
};
