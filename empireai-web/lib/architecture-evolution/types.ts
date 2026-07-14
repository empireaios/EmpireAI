/** P9-03 — Architecture Evolution Architecture frontend types (mirrors Pillow PILLOW-AEV-001). */

export type ArchitectureImprovement = {
  architectureId: string;
  title: string;
  domain: string;
  priority: number;
  status: string;
  riskLevel: string;
};

export type ArchitectureReviewSummary = {
  domain: string;
  label: string;
  status: string;
  summary: string;
};

export type ArchitectureEvolutionRecommendation = {
  id: string;
  title: string;
  why: string;
  what: string;
  how: string;
  domain: string;
  confidencePercent: number;
  riskLevel: string;
};

export type ArchitecturePipelineStep = {
  phase: string;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ArchitectureEvolutionArchitecture = {
  architectureVersion: "P9-03";
  computedAt: string;
  grandKingSummary: string;
  architectureHealth: string;
  architectureDrift: string;
  healthScore: number;
  architectureOpportunities: string[];
  currentImprovements: ArchitectureImprovement[];
  architectureTimeline: string[];
  technicalDebt: string;
  architectureRisks: string[];
  recommendations: ArchitectureEvolutionRecommendation[];
  evolutionPipeline: ArchitecturePipelineStep[];
  governedDomains: string[];
  architecturePrinciples: string[];
  healthEvaluations: string[];
  architectureReviews: ArchitectureReviewSummary[];
  architectureGovernance: string[];
  pillowAdvisory: string[];
  integrations: {
    repositoryEvolution: string;
    knowledgeEvolution: string;
    journeyStatus: string;
    builderStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  driftSignals: string[];
  duplicateArchitectures: string[];
};
