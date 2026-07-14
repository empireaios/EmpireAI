/** PILLOW-DS-001 — Durable Session Architecture types (P5-03). */

import type {
  DURABILITY_TIERS,
  SESSION_DOMAINS,
  SESSION_DOCUMENTATION_FIELDS,
  SESSION_LIFECYCLE_STATES,
} from "./paths.js";

export type SessionDomain = (typeof SESSION_DOMAINS)[number];
export type SessionLifecycleState = (typeof SESSION_LIFECYCLE_STATES)[number];
export type DurabilityTier = (typeof DURABILITY_TIERS)[number];
export type SessionDocField = (typeof SESSION_DOCUMENTATION_FIELDS)[number];

export interface DurableSessionState {
  engineVersion: "PILLOW-DS-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: SessionArchitectureAssessment | null;
}

export interface DurableSessionRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface DurableSessionBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: DurableSessionReadinessPipeline;
}

export interface DurableSessionReadinessPipeline {
  pipelineVersion: "P5-03";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  sessionRegistryComplete: boolean;
  persistenceDocumented: boolean;
  recoveryImplemented: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface SessionLayerRecord {
  id: string;
  domain: SessionDomain;
  name: string;
  purpose: string;
  persistence: string;
  durabilityTier: DurabilityTier;
  lifecycleState: SessionLifecycleState;
  recoveryStrategy: string;
  expirationPolicy: string;
  securityControls: string[];
  knownLossScenarios: string[];
  owner: string;
  futureEvolution: string;
}

export interface PersistenceModelRecord {
  id: string;
  name: string;
  mechanism: string;
  location: string;
  durabilityTier: DurabilityTier;
  expirationPolicy: string;
  cleanupPolicy: string;
  postgresCompatible: boolean;
  operationalImpact: string;
}

export interface DurableSessionSnapshot {
  capturedAt: string;
  authStoreMode: "redis" | "in_memory";
  authSessionCount: number;
  pillowHostSessionCount: number;
  pillowHostRunning: boolean;
  redisConnected: boolean;
  browserSessionPersisted: boolean;
  supervisorMissionCount: number;
  journeyEventsAvailable: boolean;
  coiRuntimeReady: boolean;
  nodeEnv: string;
}

export interface SessionRecoveryResult {
  layerId: string;
  interrupted: boolean;
  integrityValid: boolean;
  recovered: boolean;
  resumed: boolean;
  message: string;
}

export interface SessionArchitectureAssessment {
  pipelineVersion: "P5-03";
  assessedAt: string;
  overallStatus: "continuity_ok" | "degraded" | "interrupted";
  durableLayers: string[];
  ephemeralLayers: string[];
  recoverableLayers: string[];
  sessionLayers: SessionLayerRecord[];
  persistenceModels: PersistenceModelRecord[];
  snapshot: DurableSessionSnapshot | null;
  recoveryResults: SessionRecoveryResult[];
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface DurableSessionMetrics {
  totalLayers: number;
  durableCount: number;
  ephemeralCount: number;
  recoverableCount: number;
  readinessScore: number;
  driftSignals: number;
  failedRecoveries: number;
  trend: "improving" | "stable" | "degrading";
}

export interface DurableSessionAnalysis {
  sessionHealth: string[];
  sessionContinuity: string[];
  recoverySuccess: string[];
  sessionDrift: string[];
  sessionFailures: string[];
  recommendations: string[];
}
