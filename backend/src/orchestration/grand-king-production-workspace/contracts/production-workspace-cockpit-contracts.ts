/**
 * G7-01 — Cockpit Grand King production workspace backend contracts.
 */

import type {
  GrandKingProductionWorkspace,
  ProductionWorkspaceOverview,
  WorkspaceDependencySummary,
  WorkspaceHealthSummary,
  WorkspaceReadinessSummary,
} from "./production-workspace-types.js";

export const COCKPIT_PRODUCTION_WORKSPACE_VIEW_ID = "cockpit-grand-king-production-workspace" as const;

export type CockpitProductionWorkspaceView = {
  viewId: typeof COCKPIT_PRODUCTION_WORKSPACE_VIEW_ID;
  computedAt: string;
  dataMode: "production";
  workspaceOverview: ProductionWorkspaceOverview;
  workspaceHealth: WorkspaceHealthSummary;
  workspaceReadiness: WorkspaceReadinessSummary;
  workspaceDependencies: WorkspaceDependencySummary;
  workspaceConfiguration: Pick<
    GrandKingProductionWorkspace,
    "workspaceId" | "workspaceName" | "workspaceType" | "environment" | "status" | "brandIds"
  >;
  executiveSummary: string;
  discoverySource: "grand-king-production-workspace:cockpit";
};

export function buildCockpitProductionWorkspaceView(input: {
  overview: ProductionWorkspaceOverview;
  workspace: GrandKingProductionWorkspace;
  health: WorkspaceHealthSummary;
  readiness: WorkspaceReadinessSummary;
  dependencies: WorkspaceDependencySummary;
  executiveSummary: string;
}): CockpitProductionWorkspaceView {
  return {
    viewId: COCKPIT_PRODUCTION_WORKSPACE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "production",
    workspaceOverview: input.overview,
    workspaceHealth: input.health,
    workspaceReadiness: input.readiness,
    workspaceDependencies: input.dependencies,
    workspaceConfiguration: {
      workspaceId: input.workspace.workspaceId,
      workspaceName: input.workspace.workspaceName,
      workspaceType: input.workspace.workspaceType,
      environment: input.workspace.environment,
      status: input.workspace.status,
      brandIds: input.workspace.brandIds,
    },
    executiveSummary: input.executiveSummary,
    discoverySource: "grand-king-production-workspace:cockpit",
  };
}
