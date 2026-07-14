/** PILLOW-AEV-001 — Continuous Architecture Evolution Architecture types (P9-03). */

import type {
  ARCHITECTURE_EVOLUTION_PIPELINE,
  ARCHITECTURE_PRINCIPLES,
  GOVERNED_DOMAINS,
  ARCHITECTURE_HEALTH_EVALUATIONS,
  ARCHITECTURE_REVIEW_DOMAINS,
  ARCHITECTURE_GOVERNANCE_FIELDS,
} from "./paths.js";

export type ArchitectureEvolutionArchitectureVersion = "P9-03";

export type ArchitecturePipelinePhase = (typeof ARCHITECTURE_EVOLUTION_PIPELINE)[number];
export type ArchitecturePrinciple = (typeof ARCHITECTURE_PRINCIPLES)[number];
export type ArchitectureGovernedDomain = (typeof GOVERNED_DOMAINS)[number];
export type ArchitectureHealthEvaluation = (typeof ARCHITECTURE_HEALTH_EVALUATIONS)[number];
export type ArchitectureReviewDomain = (typeof ARCHITECTURE_REVIEW_DOMAINS)[number];
export type ArchitectureGovernanceField = (typeof ARCHITECTURE_GOVERNANCE_FIELDS)[number];

export type ArchitecturePipelineStep = {
  phase: ArchitecturePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ArchitectureImprovement = {
  architectureId: string;
  title: string;
  domain: string;
  priority: number;
  status: string;
  riskLevel: string;
};

export type ArchitectureReviewSummary = {
  domain: ArchitectureReviewDomain;
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

export type ArchitectureEvolutionArchitecture = {
  architectureVersion: ArchitectureEvolutionArchitectureVersion;
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
  governedDomains: ArchitectureGovernedDomain[];
  architecturePrinciples: ArchitecturePrinciple[];
  healthEvaluations: ArchitectureHealthEvaluation[];
  architectureReviews: ArchitectureReviewSummary[];
  architectureGovernance: ArchitectureGovernanceField[];
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
