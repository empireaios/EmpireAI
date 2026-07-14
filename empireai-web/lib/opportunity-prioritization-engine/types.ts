/** E1-12 — Opportunity Prioritization Engine frontend types (mirrors Pillow PILLOW-OPE-001). */

export type RankedOpportunity = {
  opportunityId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  source: string;
  strategicObjective: string;
  expectedBusinessValue: string;
  expectedFinancialValue: string;
  expectedEngineeringValue: string;
  expectedCommercialValue: string;
  riskLevel: string;
  estimatedEffort: string;
  dependencies: string[];
  expectedRoi: string;
  priorityScore: number;
  confidence: number;
  evidence: string[];
  recommendedOrder: number;
  strategicAlignment: string;
};

export type OpportunityQueueItem = {
  order: number;
  opportunityId: string;
  title: string;
  category: string;
  priorityScore: number;
  expectedRoi: string;
  owner: string;
  eta: string;
};

export type PrioritizationScoreBreakdown = {
  domain: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
};

export type OpportunityPrioritizationRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type OpportunityPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PillowOpportunityEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type OpportunityPrioritizationEngine = {
  architectureVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeOpportunityCount: number;
  topOpportunityScore: number;
  highestPriorityOpportunities: RankedOpportunity[];
  allOpportunities: RankedOpportunity[];
  opportunityQueue: OpportunityQueueItem[];
  opportunityPipeline: OpportunityPipelineStep[];
  prioritizationModel: PrioritizationScoreBreakdown[];
  recommendedActions: OpportunityPrioritizationRecommendation[];
  pillowEvaluations: PillowOpportunityEvaluationMetric[];
  opportunityPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE113: boolean;
};
