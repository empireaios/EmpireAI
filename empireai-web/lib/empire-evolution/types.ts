/** P9-05 — Empire Evolution Architecture frontend types (mirrors Pillow PILLOW-EEV-001). */

export type EmpireHealthMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ContinuousReviewMetric = {
  domain: string;
  label: string;
  alignment: string;
  summary: string;
};

export type EmpireEvolutionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type EmpirePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PhaseCompletionStatus = {
  phase: string;
  label: string;
  status: string;
  itemCount: number;
};

export type EmpireEvolutionArchitecture = {
  architectureVersion: "P9-05";
  computedAt: string;
  grandKingSummary: string;
  empireHealth: string;
  currentEvolution: string;
  strategicDirection: string;
  visionAlignment: string;
  healthScore: number;
  architectureHealth: string;
  repositoryHealth: string;
  businessHealth: string;
  commercialHealth: string;
  productionHealth: string;
  knowledgeGrowth: string;
  aiEvolution: string;
  currentRecommendations: EmpireEvolutionRecommendation[];
  evolutionPipeline: EmpirePipelineStep[];
  empireHealthMetrics: EmpireHealthMetric[];
  continuousReviews: ContinuousReviewMetric[];
  evolvingSubsystems: string[];
  empirePrinciples: string[];
  empireGovernance: string[];
  constitutionalPhases: PhaseCompletionStatus[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  constitutionalExecutionComplete: boolean;
  roadmapItemsExecuted: number;
};
