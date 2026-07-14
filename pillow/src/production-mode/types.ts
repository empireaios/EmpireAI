/** PILLOW-PM-001 — Production Mode types (P5-02). */

import type {
  COMPONENT_DOCUMENTATION_FIELDS,
  PRODUCTION_MODE_DOMAINS,
  PRODUCTION_STATES,
} from "./paths.js";

export type ProductionModeDomain = (typeof PRODUCTION_MODE_DOMAINS)[number];
export type ProductionState = (typeof PRODUCTION_STATES)[number];
export type ComponentDocField = (typeof COMPONENT_DOCUMENTATION_FIELDS)[number];

export interface ProductionModeState {
  engineVersion: "PILLOW-PM-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  lastAssessment: ProductionModeAssessment | null;
}

export interface ProductionModeRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface ProductionModeBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: ProductionModeReadinessPipeline;
}

export interface ProductionModeReadinessPipeline {
  pipelineVersion: "P5-02";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  componentRegistryComplete: boolean;
  featureFlagsDocumented: boolean;
  productionTruthAligned: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface ProductionComponentRecord {
  id: string;
  domain: ProductionModeDomain;
  name: string;
  purpose: string;
  currentState: ProductionState;
  productionState: ProductionState;
  reason: string;
  dependencies: string[];
  owner: string;
  activationRules: string;
  knownLimitations: string[];
  futureEvolution: string;
}

export interface FeatureFlagRecord {
  id: string;
  envVar: string;
  purpose: string;
  defaultValue: string;
  productionDefault: string;
  dependencies: string[];
  operationalImpact: string;
  documented: boolean;
}

export interface ProductionModeSnapshot {
  capturedAt: string;
  nodeEnv: string;
  pillowProductionMode: boolean;
  extensionRoutesEnabled: boolean;
  guardianEnabled: boolean;
  workersInProcess: boolean;
  redisOptional: boolean;
  liveCommerceMode: string;
  operationalReadyFlag: boolean;
}

export interface ProductionModeAssessment {
  pipelineVersion: "P5-02";
  assessedAt: string;
  overallStatus: "operational" | "limited" | "degraded";
  enabledModules: string[];
  disabledModules: string[];
  limitedModules: string[];
  deferredModules: string[];
  experimentalModules: string[];
  featureFlags: FeatureFlagRecord[];
  components: ProductionComponentRecord[];
  snapshot: ProductionModeSnapshot | null;
  success: boolean;
  summary: string;
  grandKingSummary: string;
}

export interface ProductionModeMetrics {
  totalComponents: number;
  enabledCount: number;
  disabledCount: number;
  documentedFlags: number;
  readinessScore: number;
  driftSignals: number;
  trend: "improving" | "stable" | "degrading";
}

export interface ProductionModeAnalysis {
  productionDrift: string[];
  configurationDrift: string[];
  featureDrift: string[];
  capabilityDrift: string[];
  productionReadiness: string[];
  recommendations: string[];
}
