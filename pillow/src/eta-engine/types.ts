/** PILLOW-ETA-001 — ETA Engine types (P6-05). */

import type {
  ETA_CALCULATION_PIPELINE,
  ETA_CONFIDENCE_CLASSIFICATIONS,
  ETA_UPDATE_TRIGGERS,
} from "./paths.js";

export type EtaPipelineStage = (typeof ETA_CALCULATION_PIPELINE)[number];
export type EtaConfidenceLevel = (typeof ETA_CONFIDENCE_CLASSIFICATIONS)[number];
export type EtaUpdateTrigger = (typeof ETA_UPDATE_TRIGGERS)[number];

export interface EtaEngineRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
  trigger?: EtaUpdateTrigger;
}

export interface EtaPipelineStageRecord {
  stage: EtaPipelineStage;
  order: number;
  description: string;
}

export interface EtaEstimate {
  missionId: string | null;
  missionTitle: string | null;
  capturedAt: string;
  elapsedTimeMs: number;
  estimatedRemainingTimeMs: number;
  predictedCompletionAt: string;
  confidencePercent: number;
  confidenceLevel: EtaConfidenceLevel;
  completionPercent: number;
  executionVelocity: number;
  criticalPath: string[];
  blockingDependencies: string[];
  currentDelayReason: string | null;
  lastEtaUpdate: string;
  reason: string;
  evidence: string[];
  knownUncertainty: string[];
  recommendedAction: string;
  pipeline: EtaPipelineStageRecord[];
}

export interface EtaReadinessPipeline {
  pipelineVersion: "P6-05";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  confidenceModelReady: boolean;
  updatePolicyDocumented: boolean;
  eccIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface EtaBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: EtaReadinessPipeline;
}

export interface EtaEngineState {
  engineVersion: "PILLOW-ETA-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  lastEstimate: EtaEstimate | null;
}

export interface EtaEngineAssessment {
  success: boolean;
  predictionQuality: "accurate" | "improving" | "degraded" | "unknown";
  lastEstimate: EtaEstimate | null;
  updateCount: number;
  recommendations: string[];
  grandKingSummary: string;
}

export interface EtaEngineMetrics {
  totalResponsibilities: number;
  pipelineStages: number;
  confidenceLevels: number;
  updateTriggers: number;
  readinessScore: number;
  updateCount: number;
  averageConfidence: number;
  trend: "stable" | "improving" | "degrading";
}

export interface EtaEngineAnalysis {
  etaAccuracy: string[];
  predictionQuality: string[];
  historicalTrends: string[];
  executionEfficiency: string[];
  planningImprovements: string[];
  recommendations: string[];
}
