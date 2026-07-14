/** PILLOW-PME-001 — Priority Management Engine types (E1-05). */

import type {
  PRIORITY_PIPELINE,
  PRIORITY_PRINCIPLES,
  GOVERNED_PRIORITY_DOMAINS,
  PRIORITY_LEVELS,
  SCORING_DOMAINS,
  REPRIORITIZATION_TRIGGERS,
  PILLOW_PRIORITY_EVALUATIONS,
} from "./paths.js";

export type PriorityManagementEngineVersion = "E1-05";

export type PriorityPipelinePhase = (typeof PRIORITY_PIPELINE)[number];
export type PriorityPrinciple = (typeof PRIORITY_PRINCIPLES)[number];
export type GovernedPriorityDomain = (typeof GOVERNED_PRIORITY_DOMAINS)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type ScoringDomain = (typeof SCORING_DOMAINS)[number];
export type ReprioritizationTrigger = (typeof REPRIORITIZATION_TRIGGERS)[number];
export type PillowPriorityEvaluation = (typeof PILLOW_PRIORITY_EVALUATIONS)[number];

export type PriorityPipelineStep = {
  phase: PriorityPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type PriorityScoreBreakdown = {
  domain: ScoringDomain;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
};

export type ManagedPriority = {
  priorityId: string;
  title: string;
  purpose: string;
  currentScore: number;
  businessImpact: string;
  engineeringImpact: string;
  commercialImpact: string;
  financialImpact: string;
  strategicImpact: string;
  riskLevel: string;
  urgency: string;
  dependencies: string[];
  confidence: number;
  recommendedOrder: number;
  supportingEvidence: string[];
  level: PriorityLevel;
  domain: GovernedPriorityDomain;
  scoreBreakdown: PriorityScoreBreakdown[];
};

export type ExecutionQueueItem = {
  order: number;
  priorityId: string;
  title: string;
  level: PriorityLevel;
  score: number;
  owner: string;
  eta: string;
};

export type PriorityChange = {
  changeId: string;
  priorityId: string;
  title: string;
  previousOrder: number;
  newOrder: number;
  reason: string;
  trigger: ReprioritizationTrigger;
  timestamp: string;
};

export type PriorityRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowPriorityEvaluationMetric = {
  domain: PillowPriorityEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type PriorityManagementEngine = {
  architectureVersion: PriorityManagementEngineVersion;
  computedAt: string;
  prioritySummary: string;
  priorityHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activePriorityCount: number;
  topPriorityScore: number;
  currentPriorities: ManagedPriority[];
  executionQueue: ExecutionQueueItem[];
  priorityChanges: PriorityChange[];
  priorityPipeline: PriorityPipelineStep[];
  scoringDomains: ScoringDomain[];
  recommendedActions: PriorityRecommendation[];
  pillowEvaluations: PillowPriorityEvaluationMetric[];
  priorityPrinciples: PriorityPrinciple[];
  governedDomains: GovernedPriorityDomain[];
  reprioritizationTriggers: ReprioritizationTrigger[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE106: boolean;
};
