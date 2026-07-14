/** P9-01 — Repository Evolution Engine frontend types (mirrors Pillow PILLOW-REV-001). */

export type RepositoryImprovement = {
  id: string;
  title: string;
  category: string;
  priority: number;
  effort: string;
  status: string;
};

export type RepositoryEvolutionRecommendation = {
  id: string;
  title: string;
  why: string;
  what: string;
  how: string;
  domain: string;
  confidencePercent: number;
};

export type EvolutionPipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type RepositoryHealthMetric = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type DriftDetectionRecord = {
  type: string;
  label: string;
  detected: boolean;
  summary: string;
};

export type RepositoryEvolutionArchitecture = {
  architectureVersion: "P9-01";
  computedAt: string;
  grandKingSummary: string;
  repositoryHealth: string;
  repositoryQuality: string;
  architectureHealth: string;
  documentationHealth: string;
  technicalDebt: string;
  knowledgeDebt: string;
  canonicalIntegrity: string;
  healthScore: number;
  currentImprovements: RepositoryImprovement[];
  evolutionQueue: RepositoryImprovement[];
  recommendations: RepositoryEvolutionRecommendation[];
  executiveRecommendations: RepositoryEvolutionRecommendation[];
  repositoryHealthMetrics: RepositoryHealthMetric[];
  driftDetection: DriftDetectionRecord[];
  improvementTypes: string[];
  evolutionPipeline: EvolutionPipelineStep[];
  governedDomains: string[];
  evolutionPrinciples: string[];
  evolutionCapabilities: string[];
  healthEvaluations: string[];
  changeGovernance: string[];
  pillowAdvisory: string[];
  integrations: Record<string, string>;
  driftSignals: string[];
  duplicateConcepts: string[];
  unusedComponents: string[];
};
