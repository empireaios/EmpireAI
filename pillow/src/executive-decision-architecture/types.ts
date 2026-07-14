/** PILLOW-EDA-001 — Executive Decision Architecture types (E2-01). */

import type {
  DECISION_PIPELINE,
  DECISION_PRINCIPLES,
  GOVERNED_DECISION_DOMAINS,
  DECISION_CLASSIFICATIONS,
  DECISION_GOVERNANCE_RECORDS,
  PILLOW_DECISION_EVALUATIONS,
} from "./paths.js";

export type ExecutiveDecisionArchitectureVersion = "E2-01";

export type DecisionPipelinePhase = (typeof DECISION_PIPELINE)[number];
export type DecisionPrinciple = (typeof DECISION_PRINCIPLES)[number];
export type GovernedDecisionDomain = (typeof GOVERNED_DECISION_DOMAINS)[number];
export type DecisionClassification = (typeof DECISION_CLASSIFICATIONS)[number];
export type DecisionGovernanceRecord = (typeof DECISION_GOVERNANCE_RECORDS)[number];
export type PillowDecisionEvaluation = (typeof PILLOW_DECISION_EVALUATIONS)[number];

export type DecisionPipelineStep = {
  phase: DecisionPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type ExecutiveDecision = {
  decisionId: string;
  title: string;
  purpose: string;
  decisionType: DecisionClassification;
  domain: GovernedDecisionDomain;
  context: string;
  evidence: string[];
  strategicObjective: string;
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  riskAssessment: string;
  dependencies: string[];
  alternativesConsidered: string[];
  confidence: number;
  decisionOwner: string;
  decisionOutcome: string;
  status: string;
};

export type DecisionQueueItem = {
  order: number;
  decisionId: string;
  title: string;
  decisionType: DecisionClassification;
  status: string;
  confidence: number;
  owner: string;
};

export type DecisionGovernanceEntry = {
  record: DecisionGovernanceRecord;
  label: string;
  value: string;
  status: string;
};

export type DecisionArchitectureRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowDecisionEvaluationMetric = {
  domain: PillowDecisionEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ExecutiveDecisionArchitecture = {
  architectureVersion: ExecutiveDecisionArchitectureVersion;
  computedAt: string;
  architectureSummary: string;
  architectureHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeDecisionCount: number;
  pendingDecisionCount: number;
  currentDecisions: ExecutiveDecision[];
  decisionQueue: DecisionQueueItem[];
  decisionPipeline: DecisionPipelineStep[];
  decisionGovernance: DecisionGovernanceEntry[];
  recommendedActions: DecisionArchitectureRecommendation[];
  pillowEvaluations: PillowDecisionEvaluationMetric[];
  decisionPrinciples: DecisionPrinciple[];
  governedDomains: GovernedDecisionDomain[];
  pillowAdvisory: string[];
  integrations: {
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE202: boolean;
};
