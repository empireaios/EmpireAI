/** PILLOW-REV-001 — Continuous Repository Evolution Architecture types (P9-01). */

import type {
  REPOSITORY_EVOLUTION_PIPELINE,
  EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  EVOLUTION_CAPABILITIES,
  HEALTH_EVALUATIONS,
  CHANGE_GOVERNANCE_FIELDS,
  REPOSITORY_HEALTH_DOMAINS,
  DRIFT_DETECTION_TYPES,
  IMPROVEMENT_TYPES,
} from "./paths.js";

export type RepositoryEvolutionArchitectureVersion = "P9-01";

export type EvolutionPipelinePhase = (typeof REPOSITORY_EVOLUTION_PIPELINE)[number];
export type EvolutionPrinciple = (typeof EVOLUTION_PRINCIPLES)[number];
export type GovernedDomain = (typeof GOVERNED_DOMAINS)[number];
export type EvolutionCapability = (typeof EVOLUTION_CAPABILITIES)[number];
export type HealthEvaluation = (typeof HEALTH_EVALUATIONS)[number];
export type ChangeGovernanceField = (typeof CHANGE_GOVERNANCE_FIELDS)[number];
export type RepositoryHealthDomain = (typeof REPOSITORY_HEALTH_DOMAINS)[number];
export type DriftDetectionType = (typeof DRIFT_DETECTION_TYPES)[number];
export type ImprovementType = (typeof IMPROVEMENT_TYPES)[number];

export type RepositoryHealthMetric = {
  domain: RepositoryHealthDomain;
  label: string;
  status: string;
  summary: string;
};

export type DriftDetectionRecord = {
  type: DriftDetectionType;
  label: string;
  detected: boolean;
  summary: string;
};

export type EvolutionPipelineStep = {
  phase: EvolutionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

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

export type RepositoryEvolutionArchitecture = {
  architectureVersion: RepositoryEvolutionArchitectureVersion;
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
  improvementTypes: ImprovementType[];
  evolutionPipeline: EvolutionPipelineStep[];
  governedDomains: GovernedDomain[];
  evolutionPrinciples: EvolutionPrinciple[];
  evolutionCapabilities: EvolutionCapability[];
  healthEvaluations: HealthEvaluation[];
  changeGovernance: ChangeGovernanceField[];
  pillowAdvisory: string[];
  integrations: {
    repositoryIntelligence: string;
    continuousEvolution: string;
    builderStatus: string;
    journeyStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  driftSignals: string[];
  duplicateConcepts: string[];
  unusedComponents: string[];
};
