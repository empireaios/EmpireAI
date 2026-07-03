/**
 * G8-00 — Identity & Authorization Platform Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildCockpitIdentityAuthorizationView,
  createCockpitIdentityAuthorizationRouteRegistration,
} from "../contracts/identity-authorization-cockpit-contracts.js";
import {
  getConnectionStatus,
  getIdentityHealth,
  getIdentityPlatformOverview,
  getIdentityPlatformSummary,
  getIdentityProviderDetail,
  getOverallReadiness,
  listIdentityProviders,
  loadIdentityPlatform,
} from "../services/identity-authorization-service.js";

export const identityAuthorizationTools: RegisteredTool[] = [
  {
    name: "load_identity_platform",
    description: "G8-00 — Bootstrap and load Identity & Authorization Platform foundation",
    module: "identity-authorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["actorId"],
    },
    handler: async (args) =>
      loadIdentityPlatform({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        pillowGovernance: true,
      }),
  },
  {
    name: "identity_summary",
    description: "G8-00 — Identity platform executive summary",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      summary: getIdentityPlatformSummary({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
      cockpitRoute: createCockpitIdentityAuthorizationRouteRegistration(),
    }),
  },
  {
    name: "identity_health",
    description: "G8-00 — Identity platform health summary",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) =>
      getIdentityHealth({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
  },
  {
    name: "identity_provider_list",
    description: "G8-00 — List foundation identity providers from registry",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      providers: listIdentityProviders({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "identity_provider_detail",
    description: "G8-00 — Identity provider detail from registry",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        providerId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args) => {
      const detail = getIdentityProviderDetail(String(args.providerId), {
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
      });
      return detail ? { provider: detail } : { error: "Provider not found" };
    },
  },
  {
    name: "connection_status",
    description: "G8-00 — Provider connection status (foundation states only)",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      connections: getConnectionStatus({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "overall_readiness",
    description: "G8-00 — Overall identity platform readiness percentage",
    module: "identity-authorization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws_empire_1");
      const overview = getIdentityPlatformOverview({ workspaceId });
      const summary = getIdentityPlatformSummary({ workspaceId });
      return {
        readiness: getOverallReadiness({ workspaceId }),
        cockpitView: buildCockpitIdentityAuthorizationView({ overview, summary }),
      };
    },
  },
];
