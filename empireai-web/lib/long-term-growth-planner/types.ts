/** E1-11 — Long-Term Growth Planner frontend types (mirrors Pillow PILLOW-LTGP-001). */

export type GrowthInitiative = {
  growthId: string;
  title: string;
  purpose: string;
  strategicObjective: string;
  domain: string;
  expectedValue: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  commercialImpact: string;
  dependencies: string[];
  resources: string[];
  targetTimeline: string;
  successCriteria: string[];
  confidence: number;
  evidence: string[];
  horizon: string;
  priority: string;
};

export type PlanningHorizonView = {
  horizon: string;
  label: string;
  timeframe: string;
  summary: string;
  visionSync: string;
  status: string;
};

export type ExpansionTimelineItem = {
  period: string;
  horizon: string;
  milestone: string;
  programmes: string[];
  status: string;
};

export type InvestmentPipelineItem = {
  investmentId: string;
  title: string;
  category: string;
  amount: string;
  timeline: string;
  expectedRoi: string;
  status: string;
};

export type GrowthAnalysisMetric = {
  domain: string;
  label: string;
  value: string;
  status: string;
};

export type GrowthOpportunityItem = {
  opportunityId: string;
  title: string;
  domain: string;
  expectedValue: string;
  horizon: string;
  confidence: number;
};

export type GrowthRiskItem = {
  riskId: string;
  title: string;
  severity: string;
  horizon: string;
  mitigation: string;
};

export type GrowthPlannerRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type GrowthHierarchyStep = {
  layer: string;
  label: string;
  order: number;
  summary: string;
};

export type GrowthPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PillowGrowthEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type LongTermGrowthPlanner = {
  architectureVersion: string;
  computedAt: string;
  plannerSummary: string;
  plannerHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  growthCapacity: string;
  growthReadiness: string;
  growthHierarchy: GrowthHierarchyStep[];
  growthPipeline: GrowthPipelineStep[];
  planningHorizons: PlanningHorizonView[];
  growthRoadmap: ExpansionTimelineItem[];
  growthObjectives: GrowthInitiative[];
  growthInitiatives: GrowthInitiative[];
  investmentPipeline: InvestmentPipelineItem[];
  growthAnalysis: GrowthAnalysisMetric[];
  strategicOpportunities: GrowthOpportunityItem[];
  growthRisks: GrowthRiskItem[];
  recommendedActions: GrowthPlannerRecommendation[];
  pillowEvaluations: PillowGrowthEvaluationMetric[];
  growthPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE112: boolean;
};
