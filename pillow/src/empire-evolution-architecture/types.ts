/** PILLOW-EEV-001 — Continuous Empire Evolution Architecture types (P9-05). */

import type {
  EMPIRE_EVOLUTION_PIPELINE,
  EMPIRE_PRINCIPLES,
  EVOLVING_SUBSYSTEMS,
  EMPIRE_HEALTH_DOMAINS,
  CONTINUOUS_REVIEW_DOMAINS,
  EMPIRE_GOVERNANCE_FIELDS,
  CONSTITUTIONAL_PHASES,
} from "./paths.js";

export type EmpireEvolutionArchitectureVersion = "P9-05";

export type EmpirePipelinePhase = (typeof EMPIRE_EVOLUTION_PIPELINE)[number];
export type EmpirePrinciple = (typeof EMPIRE_PRINCIPLES)[number];
export type EvolvingSubsystem = (typeof EVOLVING_SUBSYSTEMS)[number];
export type EmpireHealthDomain = (typeof EMPIRE_HEALTH_DOMAINS)[number];
export type ContinuousReviewDomain = (typeof CONTINUOUS_REVIEW_DOMAINS)[number];
export type EmpireGovernanceField = (typeof EMPIRE_GOVERNANCE_FIELDS)[number];
export type ConstitutionalPhase = (typeof CONSTITUTIONAL_PHASES)[number];

export type EmpirePipelineStep = {
  phase: EmpirePipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EmpireHealthMetric = {
  domain: EmpireHealthDomain;
  label: string;
  status: string;
  summary: string;
};

export type ContinuousReviewMetric = {
  domain: ContinuousReviewDomain;
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

export type PhaseCompletionStatus = {
  phase: ConstitutionalPhase;
  label: string;
  status: "complete";
  itemCount: number;
};

export type EmpireEvolutionArchitecture = {
  architectureVersion: EmpireEvolutionArchitectureVersion;
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
  evolvingSubsystems: EvolvingSubsystem[];
  empirePrinciples: EmpirePrinciple[];
  empireGovernance: EmpireGovernanceField[];
  constitutionalPhases: PhaseCompletionStatus[];
  pillowAdvisory: string[];
  integrations: {
    repositoryEvolution: string;
    knowledgeEvolution: string;
    architectureEvolution: string;
    aiEvolution: string;
    grandKingAccount: string;
    businessFactory: string;
    commerce: string;
    journeyStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
  };
  constitutionalExecutionComplete: boolean;
  roadmapItemsExecuted: number;
};
