/** PILLOW-ARE-001 — Autonomous Recovery Engine types (P6-06). */

import type {
  RECOVERY_DETECTION_SIGNALS,
  RECOVERY_ESCALATION_LEVELS,
  RECOVERY_ORCHESTRATION_PIPELINE,
  RECOVERY_STRATEGY_IDS,
} from "./paths.js";
import type { RecoveryPipelineResult } from "../recovery-doctrine/types.js";
import type { RecoveryTrigger } from "../recovery/types.js";

export type RecoveryDetectionSignal = (typeof RECOVERY_DETECTION_SIGNALS)[number];
export type RecoveryOrchestrationStage = (typeof RECOVERY_ORCHESTRATION_PIPELINE)[number];
export type RecoveryStrategyId = (typeof RECOVERY_STRATEGY_IDS)[number];
export type RecoveryEscalationLevel = (typeof RECOVERY_ESCALATION_LEVELS)[number];

export interface AutonomousRecoveryEngineRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
  trigger?: RecoveryTrigger;
}

export interface RecoveryStrategyDefinition {
  id: RecoveryStrategyId;
  purpose: string;
  safetyConditions: string[];
  maximumAttempts: number;
  failureConditions: string[];
  escalationRules: string[];
}

export interface RecoveryPipelineStageRecord {
  stage: RecoveryOrchestrationStage;
  order: number;
  description: string;
}

export interface DetectedFailure {
  signal: RecoveryDetectionSignal;
  detectedAt: string;
  missionId: string | null;
  missionTitle: string | null;
  evidence: string[];
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
}

export interface RecoveryIncident {
  incidentId: string;
  detectedAt: string;
  resolvedAt: string | null;
  failure: DetectedFailure;
  strategy: RecoveryStrategyId | null;
  confidence: number;
  escalationLevel: RecoveryEscalationLevel;
  attempts: number;
  recovered: boolean;
  pipelineResult: RecoveryPipelineResult | null;
  timeline: Array<{ at: string; stage: string; detail: string }>;
}

export interface AutonomousRecoveryReadinessPipeline {
  pipelineVersion: "P6-06";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  strategyRegistryReady: boolean;
  doctrineIntegrationReady: boolean;
  eccIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface AutonomousRecoveryBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: AutonomousRecoveryReadinessPipeline;
}

export interface AutonomousRecoveryEngineState {
  engineVersion: "PILLOW-ARE-001";
  status: "ready" | "degraded" | "blocked" | "recovering";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  activeIncident: RecoveryIncident | null;
  totalIncidents: number;
  totalRecoveriesSucceeded: number;
}

export interface AutonomousRecoveryAssessment {
  success: boolean;
  recoveryQuality: "effective" | "improving" | "degraded" | "unknown";
  lastIncident: RecoveryIncident | null;
  recommendations: string[];
  grandKingSummary: string;
}

export interface AutonomousRecoveryMetrics {
  totalResponsibilities: number;
  pipelineStages: number;
  detectionSignals: number;
  strategyCount: number;
  readinessScore: number;
  successRate: number;
  totalIncidents: number;
  totalRecoveriesSucceeded: number;
  trend: "stable" | "improving" | "degrading";
}

export interface AutonomousRecoveryAnalysis {
  recoverySuccessRate: string[];
  recurringFailures: string[];
  architectureWeaknesses: string[];
  engineeringWeaknesses: string[];
  repositoryWeaknesses: string[];
  recommendations: string[];
}
