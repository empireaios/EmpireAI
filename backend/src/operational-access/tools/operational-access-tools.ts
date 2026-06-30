import type { RegisteredTool } from "../../brain/types.js";
import { buildEmpireAccessRegistry, getPermissionMatrixForPlatform } from "../services/empire-access-registry-service.js";
import { buildAccessDashboard } from "../services/access-dashboard-service.js";
import { ACTION_BOUNDARY_RULES } from "../models/approval-boundary.js";
import { ACCESS_STATE_TRANSITIONS } from "../models/access-state-machine.js";

export const operationalAccessTools: RegisteredTool[] = [
  {
    name: "operational_access.registry",
    description: "Empire Access Registry OAR-001 — all external platforms",
    module: "operational-access",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      buildEmpireAccessRegistry(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "operational_access.dashboard",
    description: "Operational Access Dashboard OAR-008 — connected, blocked, ready, revenue gaps",
    module: "operational-access",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
    },
    handler: async (args) =>
      buildAccessDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
      ),
  },
  {
    name: "operational_access.permissions",
    description: "Permission matrix OAR-003 for a platform",
    module: "operational-access",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, platformId: { type: "string" } },
      required: ["platformId"],
    },
    handler: async (args) =>
      getPermissionMatrixForPlatform(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.platformId),
      ),
  },
  {
    name: "operational_access.approval_boundaries",
    description: "Approval boundary rules OAR-004",
    module: "operational-access",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ rules: ACTION_BOUNDARY_RULES, transitions: ACCESS_STATE_TRANSITIONS }),
  },
];
