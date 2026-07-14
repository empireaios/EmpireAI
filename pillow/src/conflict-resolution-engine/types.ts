/** PILLOW-CRE-001 — Conflict Resolution Engine types (E2-06). */

import type {
  CONFLICT_PIPELINE,
  CONFLICT_PRINCIPLES,
  GOVERNED_CONFLICT_DOMAINS,
  CONFLICT_CLASSIFICATIONS,
  RESOLUTION_STRATEGIES,
  CONFLICT_ANALYSIS_DIMENSIONS,
  PILLOW_CONFLICT_EVALUATIONS,
} from "./paths.js";

export type ConflictResolutionEngineVersion = "E2-06";

export type ConflictPipelinePhase = (typeof CONFLICT_PIPELINE)[number];
export type ConflictPrinciple = (typeof CONFLICT_PRINCIPLES)[number];
export type GovernedConflictDomain = (typeof GOVERNED_CONFLICT_DOMAINS)[number];
export type ConflictClassification = (typeof CONFLICT_CLASSIFICATIONS)[number];
export type ResolutionStrategy = (typeof RESOLUTION_STRATEGIES)[number];
export type ConflictAnalysisDimension = (typeof CONFLICT_ANALYSIS_DIMENSIONS)[number];
export type PillowConflictEvaluation = (typeof PILLOW_CONFLICT_EVALUATIONS)[number];

export type ConflictPipelineStep = {
  phase: ConflictPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type EnterpriseConflict = {
  conflictId: string;
  title: string;
  description: string;
  conflictType: ConflictClassification;
  domain: GovernedConflictDomain;
  source: string;
  affectedSystems: string[];
  businessImpact: string;
  financialImpact: string;
  engineeringImpact: string;
  strategicImpact: string;
  dependencies: string[];
  severity: string;
  priority: number;
  recommendedResolution: string;
  resolutionStrategy: ResolutionStrategy;
  confidence: number;
  evidence: string[];
  resolutionStatus: string;
  escalated: boolean;
};

export type ConflictAnalysisMetric = {
  dimension: ConflictAnalysisDimension;
  label: string;
  score: number;
  status: string;
};

export type ResolutionStatusEntry = {
  conflictId: string;
  title: string;
  resolutionStrategy: ResolutionStrategy;
  recommendedResolution: string;
  status: string;
  progress: number;
  escalated: boolean;
};

export type ConflictEscalation = {
  order: number;
  conflictId: string;
  title: string;
  severity: string;
  reason: string;
  owner: string;
};

export type ConflictResolutionRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowConflictEvaluationMetric = {
  domain: PillowConflictEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type ConflictResolutionEngine = {
  engineVersion: ConflictResolutionEngineVersion;
  computedAt: string;
  engineSummary: string;
  engineHealth: string;
  conflictHealth: string;
  visionAlignment: string;
  strategicAlignment: string;
  healthScore: number;
  activeConflictCount: number;
  criticalConflictCount: number;
  escalationCount: number;
  activeConflicts: EnterpriseConflict[];
  conflictAnalysis: ConflictAnalysisMetric[];
  resolutionStatus: ResolutionStatusEntry[];
  escalations: ConflictEscalation[];
  conflictPipeline: ConflictPipelineStep[];
  recommendedActions: ConflictResolutionRecommendation[];
  pillowEvaluations: PillowConflictEvaluationMetric[];
  conflictPrinciples: ConflictPrinciple[];
  governedDomains: GovernedConflictDomain[];
  pillowAdvisory: string[];
  integrations: {
    executiveDecisionArchitecture: string;
    riskAssessmentEngine: string;
    decisionSimulationEngine: string;
    executiveRecommendationEngine: string;
    resourceAllocationEngine: string;
    executivePlanningProgramme: string;
    corporateVisionEngine: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE207: boolean;
};
