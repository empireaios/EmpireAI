/**
 * G7-01 — Grand King production workspace contract types.
 */

import { z } from "zod";
import type { WorkspaceStatus, WorkspaceType } from "../../../registry/types/production-workspace-registry-types.js";
import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  WORKSPACE_STATUSES,
} from "../../../registry/types/production-workspace-registry-types.js";

export const GRAND_KING_PRODUCTION_WORKSPACE_VERSION = "g7-01-v1" as const;

export { WORKSPACE_STATUSES, PRODUCTION_WORKSPACE_REGISTRY_VERSION };
export type { WorkspaceStatus, WorkspaceType };

export const PRODUCTION_WORKSPACE_EKLS_KINDS = [
  "workspace_created",
  "workspace_activated",
  "workspace_configuration_updated",
  "workspace_health_changed",
  "workspace_ready",
  "workspace_blocked",
] as const;

export type ProductionWorkspaceEklsKind = (typeof PRODUCTION_WORKSPACE_EKLS_KINDS)[number];

export type ProviderReference = { providerId: string; ref: string; kind: string };

/** G7-01 — Canonical Grand King production workspace contract. */
export type GrandKingProductionWorkspace = {
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  ownerId: string;
  brandIds: string[];
  environment: "production";
  status: WorkspaceStatus;
  productionEligibility: boolean;
  readinessReference: string;
  commerceReference: string;
  automationReference: string;
  identityReference: string;
  providerReferences: ProviderReference[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type WorkspaceHealthSummary = {
  score: number;
  status: WorkspaceStatus;
  healthy: boolean;
  signals: string[];
  blockers: WorkspaceBlocker[];
};

export type WorkspaceBlocker = {
  blockerId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type WorkspaceReadinessSummary = {
  ready: boolean;
  productionEligible: boolean;
  readinessReference: string;
  certificationReference: string;
  conditions: string[];
};

export type WorkspaceDependencySummary = {
  readinessPolicy: string;
  commercePolicy: string;
  automationWorkflow: string;
  connectionProviders: ProviderReference[];
  identityRef: string;
};

export type ProductionWorkspaceOverview = {
  frameworkVersion: typeof GRAND_KING_PRODUCTION_WORKSPACE_VERSION;
  workspaceCount: number;
  canonicalWorkspaceId: string;
  workspaceStatus?: WorkspaceStatus;
  productionEligible: boolean;
  healthScore: number;
  generatedAt: string;
};

export const productionWorkspacePluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["validator", "health", "configuration", "monitoring"]),
  pillowGovernance: z.literal(true),
});

export type ProductionWorkspacePluginManifest = z.infer<typeof productionWorkspacePluginManifestSchema>;

export const VALID_WORKSPACE_TRANSITIONS: Record<WorkspaceStatus, WorkspaceStatus[]> = {
  creating: ["configuring", "blocked"],
  configuring: ["ready", "blocked"],
  ready: ["active", "blocked", "maintenance"],
  active: ["maintenance", "paused", "degraded", "blocked", "archived"],
  maintenance: ["active", "ready", "blocked"],
  paused: ["active", "ready", "blocked"],
  degraded: ["active", "maintenance", "blocked"],
  blocked: ["configuring", "ready", "archived"],
  archived: [],
};

export function isValidWorkspaceTransition(from: WorkspaceStatus, to: WorkspaceStatus): boolean {
  return VALID_WORKSPACE_TRANSITIONS[from]?.includes(to) ?? false;
}
