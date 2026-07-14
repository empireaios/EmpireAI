/** PILLOW-OPE-001 — Opportunity Prioritization Engine types (E1-12). */

import type {
  OPPORTUNITY_PIPELINE,
  OPPORTUNITY_PRINCIPLES,
  GOVERNED_OPPORTUNITY_DOMAINS,
  OPPORTUNITY_CLASSIFICATIONS,
  PRIORITIZATION_MODEL_DOMAINS,
  PILLOW_OPPORTUNITY_EVALUATIONS,
  OPPORTUNITY_SOURCES,
} from "./paths.js";

export type OpportunityPrioritizationEngineVersion = "E1-12";

export type OpportunityPipelinePhase = (typeof OPPORTUNITY_PIPELINE)[number];
export type OpportunityPrinciple = (typeof OPPORTUNITY_PRINCIPLES)[number];
export type GovernedOpportunityDomain = (typeof GOVERNED_OPPORTUNITY_DOMAINS)[number];
export type OpportunityClassification = (typeof OPPORTUNITY_CLASSIFICATIONS)[number];
export type PrioritizationModelDomain = (typeof PRIORITIZATION_MODEL_DOMAINS)[number];
export type PillowOpportunityEvaluation = (typeof PILLOW_OPPORTUNITY_EVALUATIONS)[number];
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];

export type OpportunityPipelineStep = {
  phase: OpportunityPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PrioritizationScoreBreakdown = {
  domain: PrioritizationModelDomain;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
};

export type RankedOpportunity = {
  opportunityId: string;
  title: string;
  description: string;
  category: OpportunityClassification;
  domain: GovernedOpportunityDomain;
  source: OpportunitySource;
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
  scoreBreakdown: PrioritizationScoreBreakdown[];
  recommendedOrder: number;
  strategicAlignment: string;
};

export type OpportunityQueueItem = {
  order: number;
  opportunityId: string;
  title: string;
  category: OpportunityClassification;
  priorityScore: number;
  expectedRoi: string;
  owner: string;
  eta: string;
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

export type PillowOpportunityEvaluationMetric = {
  domain: PillowOpportunityEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type OpportunityPrioritizationEngine = {
  architectureVersion: OpportunityPrioritizationEngineVersion;
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
  opportunityPrinciples: OpportunityPrinciple[];
  governedDomains: GovernedOpportunityDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    longTermGrowthPlanner: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE113: boolean;
};
