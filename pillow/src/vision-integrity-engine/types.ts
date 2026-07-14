/** PILLOW-VIE-001 — Vision Integrity Engine types (P6-02). */

import type {
  INTEGRITY_CLASSIFICATIONS,
  INTEGRITY_REVIEW_DIMENSIONS,
  VIE_DRIFT_SIGNALS,
  VIE_PRINCIPLES,
  VIE_RESPONSIBILITIES,
  VIE_VALIDATION_PIPELINE,
} from "./paths.js";

export type ViePrinciple = (typeof VIE_PRINCIPLES)[number];
export type VieResponsibility = (typeof VIE_RESPONSIBILITIES)[number];
export type ViePipelineStage = (typeof VIE_VALIDATION_PIPELINE)[number];
export type VieDriftSignal = (typeof VIE_DRIFT_SIGNALS)[number];
export type IntegrityClassification = (typeof INTEGRITY_CLASSIFICATIONS)[number];
export type IntegrityReviewDimension = (typeof INTEGRITY_REVIEW_DIMENSIONS)[number];
export type ApprovalStatus = "approved" | "conditional" | "blocked";

export interface VisionIntegrityEngineState {
  engineVersion: "PILLOW-VIE-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  lastAssessment: VisionIntegrityAssessment | null;
}

export interface VisionIntegrityRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface VisionIntegrityBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: VisionIntegrityReadinessPipeline;
}

export interface VisionIntegrityReadinessPipeline {
  pipelineVersion: "P6-02";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  driftDetectionReady: boolean;
  classificationsDocumented: boolean;
  eccIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface IntegrityPipelineStageRecord {
  stage: ViePipelineStage;
  order: number;
  owner: string;
  description: string;
}

export interface IntegrityDriftRecord {
  id: string;
  signal: VieDriftSignal;
  description: string;
  detectionMethod: string;
}

export interface IntegrityEvaluationRecord {
  classification: IntegrityClassification;
  reason: string;
  evidence: string[];
  impact: string;
  recommendation: string;
}

export interface IntegrityReviewRecord {
  dimension: IntegrityReviewDimension;
  summary: string;
  aligned: boolean;
}

export interface VisionIntegritySnapshot {
  capturedAt: string;
  nodeEnv: string;
  classification: IntegrityClassification;
  approvalStatus: ApprovalStatus;
  visionAlignmentScore: number;
  driftCount: number;
  violationCount: number;
  missionId: string | null;
  missionTitle: string | null;
}

export interface VisionIntegrityAssessment {
  pipelineVersion: "P6-02";
  assessedAt: string;
  classification: IntegrityClassification;
  approvalStatus: ApprovalStatus;
  visionAlignmentScore: number;
  pipeline: IntegrityPipelineStageRecord[];
  driftSignals: IntegrityDriftRecord[];
  evaluation: IntegrityEvaluationRecord;
  review: IntegrityReviewRecord[];
  detectedDrifts: string[];
  violations: string[];
  recommendations: string[];
  snapshot: VisionIntegritySnapshot | null;
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface VisionIntegrityMetrics {
  totalResponsibilities: number;
  pipelineStages: number;
  driftSignals: number;
  classifications: number;
  readinessScore: number;
  visionAlignmentScore: number;
  trend: "improving" | "stable" | "degrading";
}

export interface VisionIntegrityAnalysis {
  repositoryEvolution: string[];
  architectureEvolution: string[];
  engineeringEvolution: string[];
  businessEvolution: string[];
  missionEvolution: string[];
  knowledgeEvolution: string[];
  recommendations: string[];
}

export interface MissionIntegrityResult {
  allowed: boolean;
  classification: IntegrityClassification;
  approvalStatus: ApprovalStatus;
  alignment: string;
  detectedDrift: string[];
  evidence: string[];
  recommendation: string;
  reason: string;
}
