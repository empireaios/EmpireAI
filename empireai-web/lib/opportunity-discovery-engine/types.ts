/** E4-03 — Opportunity Discovery Engine frontend types (mirrors Pillow PILLOW-ODE-001). */

export type OpportunityRecord = {
  opportunityId: string;
  title: string;
  category: string;
  domain: string;
  source: string;
  market: string;
  industry: string;
  estimatedMarketSize: string;
  expectedRevenue: string;
  strategicValue: string;
  businessValue: string;
  opportunityScore: number;
  riskLevel: number;
  priority: string;
  confidence: number;
  evidence: string[];
};

export type PriorityOpportunityEntry = {
  priorityId: string;
  opportunityId: string;
  title: string;
  priorityRank: number;
  opportunityScore: number;
  expectedRevenue: string;
  strategicValue: string;
  status: string;
};

export type RevenuePotentialEntry = {
  revenueId: string;
  opportunityId: string;
  title: string;
  expectedRevenue: string;
  revenueHorizon: string;
  confidence: number;
  market: string;
  status: string;
};

export type GrowthPotentialEntry = {
  growthId: string;
  opportunityId: string;
  title: string;
  growthRate: string;
  marketSize: string;
  expansionPotential: string;
  status: string;
};

export type StrategicValueEntry = {
  valueId: string;
  opportunityId: string;
  title: string;
  strategicValue: string;
  visionAlignment: string;
  longTermImpact: string;
  status: string;
};

export type OpportunityRiskEntry = {
  riskId: string;
  opportunityId: string;
  title: string;
  riskLevel: number;
  severity: string;
  mitigation: string;
  status: string;
};

export type OpportunityTrendEntry = {
  trendId: string;
  trend: string;
  direction: string;
  affectedOpportunities: string;
  discoverySignal: string;
  confidence: number;
  status: string;
};

export type OpportunityAnalysisMetric = {
  domain: string;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type OpportunityDiscoveryRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowOpportunityEvaluationMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type OpportunityDiscoveryPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: string;
};

export type OpportunityDiscoveryEngine = {
  engineVersion: string;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  opportunityDiscoveryHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  discoveredOpportunityCount: number;
  priorityOpportunityCount: number;
  highValueOpportunityCount: number;
  averageOpportunityScore: number;
  opportunityPipeline: OpportunityRecord[];
  priorityOpportunities: PriorityOpportunityEntry[];
  revenuePotential: RevenuePotentialEntry[];
  growthPotential: GrowthPotentialEntry[];
  strategicValue: StrategicValueEntry[];
  opportunityRisks: OpportunityRiskEntry[];
  opportunityTrends: OpportunityTrendEntry[];
  opportunityAnalysis: OpportunityAnalysisMetric[];
  opportunityDiscoveryPipeline: OpportunityDiscoveryPipelineStep[];
  recommendedActions: OpportunityDiscoveryRecommendation[];
  pillowEvaluations: PillowOpportunityEvaluationMetric[];
  opportunityPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE404: boolean;
};
