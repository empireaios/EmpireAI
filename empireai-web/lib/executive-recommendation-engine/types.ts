/** E2-04 — Executive Recommendation Engine frontend types (mirrors Pillow PILLOW-ERE-001). */

export type ExecutiveRecommendation = {
  recommendationId: string;
  title: string;
  purpose: string;
  recommendationType: string;
  domain: string;
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
  dimension: string;
  label: string;
  score: number;
  status: string;
};

export type PriorityRecommendationItem = {
  order: number;
  recommendationId: string;
  title: string;
  priority: number;
  recommendationType: string;
  confidence: number;
  businessImpact: string;
  status: string;
};

export type RecommendationPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
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
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveRecommendationEngine = {
  engineVersion: string;
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
  recommendationPrinciples: string[];
  governedDomains: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  readyForE205: boolean;
};
