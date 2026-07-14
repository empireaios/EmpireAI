/** PILLOW-ERE-001 — Executive Recommendation Engine types (E2-04). */

import type {
  RECOMMENDATION_PIPELINE,
  RECOMMENDATION_PRINCIPLES,
  GOVERNED_RECOMMENDATION_DOMAINS,
  RECOMMENDATION_CLASSIFICATIONS,
  RECOMMENDATION_QUALITY_DIMENSIONS,
  EXPLAINABILITY_FIELDS,
  PILLOW_RECOMMENDATION_GENERATIONS,
} from "./paths.js";

export type ExecutiveRecommendationEngineVersion = "E2-04";

export type RecommendationPipelinePhase = (typeof RECOMMENDATION_PIPELINE)[number];
export type RecommendationPrinciple = (typeof RECOMMENDATION_PRINCIPLES)[number];
export type GovernedRecommendationDomain = (typeof GOVERNED_RECOMMENDATION_DOMAINS)[number];
export type RecommendationClassification = (typeof RECOMMENDATION_CLASSIFICATIONS)[number];
export type RecommendationQualityDimension = (typeof RECOMMENDATION_QUALITY_DIMENSIONS)[number];
export type ExplainabilityField = (typeof EXPLAINABILITY_FIELDS)[number];
export type PillowRecommendationGeneration = (typeof PILLOW_RECOMMENDATION_GENERATIONS)[number];

export type RecommendationPipelineStep = {
  phase: RecommendationPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  title: string;
  purpose: string;
  recommendationType: RecommendationClassification;
  domain: GovernedRecommendationDomain;
  priority: number;
  supportingEvidence: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  riskAssessment: string;
  alternativesConsidered: string[];
  confidence: number;
  recommendedAction: string;
  expectedOutcome: string;
  status: string;
};

export type RecommendationExplainability = {
  recommendationId: string;
  title: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  businessImpact: string;
  strategicImpact: string;
  risk: string;
  confidence: number;
  alternativeOptions: string[];
};

export type RecommendationQualityMetric = {
  dimension: RecommendationQualityDimension;
  label: string;
  score: number;
  status: string;
};

export type PriorityRecommendationItem = {
  order: number;
  recommendationId: string;
  title: string;
  priority: number;
  recommendationType: RecommendationClassification;
  confidence: number;
  businessImpact: string;
  status: string;
};

export type EngineRecommendationAction = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowRecommendationGenerationMetric = {
  domain: PillowRecommendationGeneration;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveRecommendationEngine = {
  engineVersion: ExecutiveRecommendationEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeRecommendationCount: number;
  highPriorityCount: number;
  currentRecommendations: ExecutiveRecommendation[];
  priorityQueue: PriorityRecommendationItem[];
  explainability: RecommendationExplainability[];
  qualityMetrics: RecommendationQualityMetric[];
  recommendationPipeline: RecommendationPipelineStep[];
  recommendedActions: EngineRecommendationAction[];
  pillowGenerations: PillowRecommendationGenerationMetric[];
  recommendationPrinciples: RecommendationPrinciple[];
  governedDomains: GovernedRecommendationDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE205: boolean;
};
