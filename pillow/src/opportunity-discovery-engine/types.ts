/** PILLOW-ODE-001 — Opportunity Discovery Engine types (E4-03). */

import type {
  OPPORTUNITY_DISCOVERY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  OPPORTUNITY_CLASSIFICATIONS,
  OPPORTUNITY_ANALYSIS_DOMAINS,
  PILLOW_OPPORTUNITY_EVALUATIONS,
} from "./paths.js";

export type OpportunityDiscoveryEngineVersion = "E4-03";

export type OpportunityDiscoveryPipelinePhase = (typeof OPPORTUNITY_DISCOVERY_PIPELINE)[number];
export type OpportunityPrinciple = (typeof OPPORTUNITY_PRINCIPLES)[number];
export type GovernedOpportunityDomain = (typeof GOVERNED_OPPORTUNITY_DOMAINS)[number];
export type OpportunityClassification = (typeof OPPORTUNITY_CLASSIFICATIONS)[number];
export type OpportunityAnalysisDomain = (typeof OPPORTUNITY_ANALYSIS_DOMAINS)[number];
export type PillowOpportunityEvaluation = (typeof PILLOW_OPPORTUNITY_EVALUATIONS)[number];

export type OpportunityDiscoveryPipelineStep = {
  phase: OpportunityDiscoveryPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type OpportunityRecord = {
  opportunityId: string;
  title: string;
  category: OpportunityClassification;
  domain: GovernedOpportunityDomain;
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
  domain: OpportunityAnalysisDomain;
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
  domain: PillowOpportunityEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type OpportunityDiscoveryEngine = {
  engineVersion: OpportunityDiscoveryEngineVersion;
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
  opportunityPrinciples: OpportunityPrinciple[];
  governedDomains: GovernedOpportunityDomain[];
  pillowAdvisory: string[];
  integrations: {
    marketIntelligenceEngine: string;
    competitorIntelligenceEngine: string;
    financialExecutiveCertification: string;
    executiveDecisionCertification: string;
    corporateVisionEngine: string;
    executiveRecommendationEngine: string;
    knowledgeEvolution: string;
    guardianStatus: string;
    executivePlanningProgramme: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE404: boolean;
};
