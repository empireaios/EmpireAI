/** PILLOW-MI-001 — Marketplace Integration types (P8-03). */

import type {
  MARKETPLACE_CONNECTOR_CAPABILITIES,
  MARKETPLACE_FAILURE_KINDS,
  MARKETPLACE_INTEGRATION_PIPELINE,
  MARKETPLACE_SYNC_DOMAINS,
} from "./paths.js";

export type MarketplaceIntegrationPipelinePhase = (typeof MARKETPLACE_INTEGRATION_PIPELINE)[number];
export type MarketplaceSyncDomain = (typeof MARKETPLACE_SYNC_DOMAINS)[number];
export type MarketplaceConnectorCapability = (typeof MARKETPLACE_CONNECTOR_CAPABILITIES)[number];
export type MarketplaceFailureKind = (typeof MARKETPLACE_FAILURE_KINDS)[number];

export interface MarketplaceIntegrationRequest {
  missionId?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface MarketplaceIntegrationReadinessPipeline {
  pipelineVersion: "P8-03";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  connectorModelDocumented: boolean;
  pipelineDocumented: boolean;
  syncArchitectureDocumented: boolean;
  failureRecoveryMapped: boolean;
  g2FoundationIntegrated: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface MarketplaceIntegrationGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: MarketplaceIntegrationReadinessPipeline;
}

export interface MarketplaceIntegrationEngineState {
  engineVersion: "PILLOW-MI-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  connectorCount: number;
  pipelinePhaseCount: number;
}

export interface MarketplaceConnectorAssessment {
  connectorId: string;
  displayName: string;
  integrationQuality: "excellent" | "good" | "architecture_ready" | "blocked";
  providerStability: "stable" | "emerging" | "unknown";
  commercialOpportunity: string;
  improvement: string;
}

export interface MarketplaceIntegrationAssessment {
  success: boolean;
  overallHealth: "healthy" | "degraded" | "critical";
  connectorAssessments: MarketplaceConnectorAssessment[];
  recommendations: string[];
  warnings: string[];
  risks: string[];
  grandKingSummary: string;
}

export interface MarketplaceIntegrationMetrics {
  connectorCount: number;
  pipelinePhases: number;
  syncDomains: number;
  failureKinds: number;
  capabilityCount: number;
  readinessScore: number;
}

export interface MarketplaceIntegrationAnalysis {
  integrationQuality: string[];
  providerStability: string[];
  commercialOpportunities: string[];
  connectorImprovements: string[];
  futureMarketplaceRecommendations: string[];
}

export interface MarketplaceIntegrationCockpitSnapshot {
  connectedMarketplaces: number;
  connectorHealth: "healthy" | "degraded" | "blocked";
  syncStatus: string;
  currentFailures: string[];
  recoveryStatus: string;
  performanceSummary: string;
  executiveSummary: string;
}
