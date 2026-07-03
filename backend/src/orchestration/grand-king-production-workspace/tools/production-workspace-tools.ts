/**
 * G7-01 — Grand King production workspace Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitProductionWorkspaceView } from "../contracts/production-workspace-cockpit-contracts.js";
import {
  activateGrandKingProductionWorkspace,
  createGrandKingProductionWorkspace,
  getGrandKingProductionWorkspace,
  getProductionWorkspaceOverview,
  getWorkspaceConfiguration,
  getWorkspaceDependencies,
  getWorkspaceHealth,
  getWorkspaceReadiness,
  getWorkspaceSummary,
} from "../services/grand-king-production-workspace-service.js";

export const grandKingProductionWorkspaceTools: RegisteredTool[] = [
  {
    name: "workspace_overview",
    description: "G7-01 — Grand King production workspace overview and Cockpit view",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws_empire_1");
      try {
        const workspace = getGrandKingProductionWorkspace();
        const overview = getProductionWorkspaceOverview({ workspaceId });
        const health = getWorkspaceHealth({ workspaceId });
        const readiness = getWorkspaceReadiness({ workspaceId });
        const dependencies = getWorkspaceDependencies({ workspaceId });
        const summary = getWorkspaceSummary({ workspaceId });
        return {
          overview,
          cockpitView: buildCockpitProductionWorkspaceView({
            overview,
            workspace,
            health,
            readiness,
            dependencies,
            executiveSummary: summary,
          }),
        };
      } catch {
        const overview = getProductionWorkspaceOverview({ workspaceId });
        return { overview, cockpitView: undefined, message: "Workspace not initialized" };
      }
    },
  },
  {
    name: "workspace_status",
    description: "G7-01 — Grand King production workspace status",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ workspace: getGrandKingProductionWorkspace() }),
  },
  {
    name: "workspace_health",
    description: "G7-01 — Grand King production workspace health",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getWorkspaceHealth({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "workspace_readiness",
    description: "G7-01 — Grand King production workspace readiness",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getWorkspaceReadiness({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "workspace_configuration",
    description: "G7-01 — Grand King production workspace configuration",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getWorkspaceConfiguration({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "workspace_dependencies",
    description: "G7-01 — Grand King production workspace dependencies",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getWorkspaceDependencies({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "workspace_summary",
    description: "G7-01 — Grand King production workspace executive summary",
    module: "grand-king-production-workspace",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      summary: getWorkspaceSummary({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "create_grand_king_production_workspace",
    description: "G7-01 — Create canonical Grand King production workspace",
    module: "grand-king-production-workspace",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" } },
      required: ["actorId"],
    },
    handler: async (args) =>
      createGrandKingProductionWorkspace({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        pillowGovernance: true,
      }),
  },
  {
    name: "activate_grand_king_production_workspace",
    description: "G7-01 — Activate Grand King production workspace",
    module: "grand-king-production-workspace",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" } },
      required: ["actorId"],
    },
    handler: async (args) =>
      activateGrandKingProductionWorkspace({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        pillowGovernance: true,
      }),
  },
];
