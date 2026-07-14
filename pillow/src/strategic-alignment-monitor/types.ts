/** PILLOW-SAM-001 — Strategic Alignment Monitor types (E1-13). */

import type {
  ALIGNMENT_PIPELINE,
  ALIGNMENT_PRINCIPLES,
  GOVERNED_ALIGNMENT_DOMAINS,
  ALIGNMENT_SCORING_DOMAINS,
  DRIFT_DETECTION_TYPES,
  PILLOW_ALIGNMENT_EVALUATIONS,
  ALIGNMENT_SCOPES,
  DEVIATION_LEVELS,
} from "./paths.js";

export type StrategicAlignmentMonitorVersion = "E1-13";

export type AlignmentPipelinePhase = (typeof ALIGNMENT_PIPELINE)[number];
export type AlignmentPrinciple = (typeof ALIGNMENT_PRINCIPLES)[number];
export type GovernedAlignmentDomain = (typeof GOVERNED_ALIGNMENT_DOMAINS)[number];
export type AlignmentScoringDomain = (typeof ALIGNMENT_SCORING_DOMAINS)[number];
export type DriftDetectionType = (typeof DRIFT_DETECTION_TYPES)[number];
export type PillowAlignmentEvaluation = (typeof PILLOW_ALIGNMENT_EVALUATIONS)[number];
export type AlignmentScope = (typeof ALIGNMENT_SCOPES)[number];
export type DeviationLevel = (typeof DEVIATION_LEVELS)[number];

export type AlignmentPipelineStep = {
  phase: AlignmentPipelinePhase;
  label: string;
  order: number;
  status: "complete" | "active" | "pending";
};

export type AlignmentAssessment = {
  alignmentId: string;
  scope: AlignmentScope;
  domain: GovernedAlignmentDomain;
  relatedVision: string;
  relatedStrategicObjective: string;
  currentAlignmentScore: number;
  deviationLevel: DeviationLevel;
  businessImpact: string;
  strategicImpact: string;
  riskLevel: string;
  correctiveRecommendation: string;
  confidence: number;
  evidence: string[];
};

export type AlignmentScoreMetric = {
  domain: AlignmentScoringDomain;
  label: string;
  score: number;
  status: string;
  summary: string;
};

export type DriftDetectionItem = {
  driftId: string;
  driftType: DriftDetectionType;
  label: string;
  scope: string;
  severity: string;
  deviationLevel: DeviationLevel;
  description: string;
  correctiveAction: string;
  detectedAt: string;
};

export type AlignmentTrendItem = {
  period: string;
  overallScore: number;
  visionScore: number;
  programmeScore: number;
  trend: string;
};

export type StrategicAlignmentRecommendation = {
  id: string;
  title: string;
  category: string;
  why: string;
  what: string;
  how: string;
  confidencePercent: number;
};

export type PillowAlignmentEvaluationMetric = {
  domain: PillowAlignmentEvaluation;
  label: string;
  status: string;
  summary: string;
};

export type StrategicAlignmentMonitor = {
  architectureVersion: StrategicAlignmentMonitorVersion;
  computedAt: string;
  monitorSummary: string;
  monitorHealth: string;
  overallAlignmentScore: number;
  visionAlignment: string;
  programmeAlignment: string;
  departmentAlignment: string;
  businessAlignment: string;
  currentDrift: string;
  healthScore: number;
  alignmentAssessments: AlignmentAssessment[];
  alignmentScoring: AlignmentScoreMetric[];
  driftDetections: DriftDetectionItem[];
  alignmentTrends: AlignmentTrendItem[];
  alignmentPipeline: AlignmentPipelineStep[];
  recommendedActions: StrategicAlignmentRecommendation[];
  pillowEvaluations: PillowAlignmentEvaluationMetric[];
  alignmentPrinciples: AlignmentPrinciple[];
  governedDomains: GovernedAlignmentDomain[];
  pillowAdvisory: string[];
  integrations: {
    corporateVisionEngine: string;
    strategicObjectiveEngine: string;
    executiveRoadmapEngine: string;
    priorityManagementEngine: string;
    opportunityPrioritizationEngine: string;
    executiveArchitecture: string;
    journeyStatus: string;
    supervisorStatus: string;
    eccStatus: string;
    vieStatus: string;
  };
  readyForE114: boolean;
};
