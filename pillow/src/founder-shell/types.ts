/** PILLOW-FS-001 — Founder Shell types (P7-01). */

import type {
  FOUNDER_CONTEXT_FIELDS,
  FOUNDER_NAVIGATION_ORDER,
  FOUNDER_WORKSPACES,
} from "./paths.js";

export type FounderWorkspaceId = (typeof FOUNDER_WORKSPACES)[number];
export type FounderNavId = (typeof FOUNDER_NAVIGATION_ORDER)[number];
export type FounderContextField = (typeof FOUNDER_CONTEXT_FIELDS)[number];

export interface FounderShellRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  workspaceId?: string | null;
  grandKingOverride?: boolean;
}

export interface FounderNavigationItem {
  id: FounderNavId;
  label: string;
  workspaceId: FounderWorkspaceId;
  cockpitRoute: string;
  description: string;
}

export interface FounderWorkspaceRecord {
  id: FounderWorkspaceId;
  label: string;
  cockpitRoute: string;
  status: "ready" | "degraded" | "unavailable";
  integrated: boolean;
}

export interface FounderShellContext {
  currentBusiness: string | null;
  currentMission: string | null;
  currentJourney: string | null;
  currentContext: string | null;
  currentNotifications: number;
  currentRecommendations: string[];
  currentSession: string | null;
  currentWorkspace: FounderWorkspaceId;
}

export interface ExecutiveHomeSummary {
  businessStatus: string;
  missionStatus: string;
  builderStatus: string;
  supervisorStatus: string;
  productionStatus: string;
  revenue: string;
  alerts: string[];
  recommendations: string[];
  currentJourney: string;
  pendingActions: string[];
}

export interface FounderShellReadinessPipeline {
  pipelineVersion: "P7-01";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  navigationReady: boolean;
  workspacesReady: boolean;
  cockpitIntegrationReady: boolean;
  contextPreservationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface FounderShellGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: FounderShellReadinessPipeline;
}

export interface FounderShellEngineState {
  engineVersion: "PILLOW-FS-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  workspaceCount: number;
  navigationCount: number;
  lastContext: FounderShellContext | null;
}

export interface FounderShellAssessment {
  shellHealth: "healthy" | "degraded" | "blocked";
  navigationConsistent: boolean;
  contextPreserved: boolean;
  cockpitIntegrated: boolean;
  grandKingSummary: string;
}

export interface FounderShellMetrics {
  workspaceReadyCount: number;
  workspaceTotal: number;
  navigationItemCount: number;
  contextFieldCount: number;
  integrationScore: number;
}
