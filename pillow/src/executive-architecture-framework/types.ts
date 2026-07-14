/** PILLOW-EAF-001 — Executive Architecture Framework types (E1-01). */

import type {
  EXECUTIVE_PLANNING_PIPELINE,
  EXECUTIVE_LAYERS,
  EXECUTIVE_PRINCIPLES,
  EXECUTIVE_GOVERNED_DOMAINS,
  EXECUTIVE_RESPONSIBILITIES,
  EXECUTIVE_OWNERSHIP,
  PILLOW_EXECUTIVE_EVALUATIONS,
} from "./paths.js";

export type ExecutiveArchitectureFrameworkVersion = "E1-01";

export type ExecutivePlanningPhase = (typeof EXECUTIVE_PLANNING_PIPELINE)[number];
export type ExecutiveLayer = (typeof EXECUTIVE_LAYERS)[number];
export type ExecutivePrinciple = (typeof EXECUTIVE_PRINCIPLES)[number];
export type ExecutiveGovernedDomain = (typeof EXECUTIVE_GOVERNED_DOMAINS)[number];
export type ExecutiveResponsibility = (typeof EXECUTIVE_RESPONSIBILITIES)[number];
export type ExecutiveOwnershipRole = (typeof EXECUTIVE_OWNERSHIP)[number];
export type PillowExecutiveEvaluation = (typeof PILLOW_EXECUTIVE_EVALUATIONS)[number];

export type ExecutivePlanningStep = {
  phase: ExecutivePlanningPhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveLayerStep = {
  layer: ExecutiveLayer;
  label: string;
  order: number;
  owner: string;
  summary: string;
};

export type ExecutiveObjective = {
  id: string;
  title: string;
  status: string;
  alignment: string;
};

export type ExecutivePriority = {
  id: string;
  title: string;
  rank: number;
  status: string;
};

export type ExecutiveInitiative = {
  id: string;
  title: string;
  phase: string;
  status: string;
};

export type ExecutiveRisk = {
  id: string;
  title: string;
  severity: string;
  mitigation: string;
};

export type ExecutiveOpportunity = {
  id: string;
  title: string;
  impact: string;
  confidencePercent: number;
};

export type ExecutiveArchitectureRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type ExecutiveEvaluationMetric = {
  domain: PillowExecutiveEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveOwnershipEntry = {
  role: ExecutiveOwnershipRole;
  label: string;
  responsibilities: string[];
};

export type ExecutiveArchitectureFramework = {
  architectureVersion: ExecutiveArchitectureFrameworkVersion;
  computedAt: string;
  executiveSummary: string;
  executiveHealth: string;
  strategicDirection: string;
  planningStatus: string;
  healthScore: number;
  visionAlignment: string;
  constitutionStatus: string;
  currentObjectives: ExecutiveObjective[];
  currentPriorities: ExecutivePriority[];
  currentInitiatives: ExecutiveInitiative[];
  executiveRisks: ExecutiveRisk[];
  executiveOpportunities: ExecutiveOpportunity[];
  executiveRecommendations: ExecutiveArchitectureRecommendation[];
  planningPipeline: ExecutivePlanningStep[];
  executiveLayers: ExecutiveLayerStep[];
  executivePrinciples: ExecutivePrinciple[];
  governedDomains: ExecutiveGovernedDomain[];
  executiveResponsibilities: ExecutiveResponsibility[];
  executiveOwnership: ExecutiveOwnershipEntry[];
  pillowEvaluations: ExecutiveEvaluationMetric[];
  pillowAdvisory: string[];
  integrations: {
    empireEvolution: string;
    grandKingAccount: string;
    visionIntegrity: string;
    businessFactory: string;
    commerce: string;
    journeyStatus: string;
    supervisorStatus: string;
    guardianStatus: string;
    eccStatus: string;
    builderStatus: string;
  };
  constitutionalFoundationComplete: boolean;
  readyForE102: boolean;
};
