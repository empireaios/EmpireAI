/**
 * G8-01 — Connection Registry Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  buildCockpitConnectionRegistryView,
  createCockpitAuthorizationCentreRouteRegistration,
} from "../contracts/connection-registry-cockpit-contracts.js";
import {
  getConnectionCapabilities,
  getConnectionDependencies,
  getConnectionProviderDetail,
  getConnectionRegistryList,
  getConnectionRequirements,
  getWorkspaceConnectionProfile,
  initializeConnectionRegistry,
} from "../services/connection-registry-service.js";

export const connectionRegistryTools: RegisteredTool[] = [
  {
    name: "connection_registry_list",
    description: "G8-01 — List connection providers from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      providers: getConnectionRegistryList({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "connection_provider_detail",
    description: "G8-01 — Connection provider detail from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { providerId: { type: "string" }, workspaceId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => {
      const provider = getConnectionProviderDetail(String(args.providerId), {
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
      });
      return provider ? { provider } : { error: "Provider not found" };
    },
  },
  {
    name: "connection_requirements",
    description: "G8-01 — Connection requirements from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      requirements: getConnectionRequirements({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "connection_capabilities",
    description: "G8-01 — Provider capabilities from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      capabilities: getConnectionCapabilities({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "connection_dependencies",
    description: "G8-01 — Connection dependencies from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      dependencies: getConnectionDependencies({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
    }),
  },
  {
    name: "workspace_connection_profile",
    description: "G8-01 — Workspace connection profile from registry",
    module: "connection-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws_empire_1");
      const profile = getWorkspaceConnectionProfile(
        {
          workspaceId,
          accountHolderId: args.accountHolderId ? String(args.accountHolderId) : undefined,
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
        },
        { workspaceId },
      );
      return {
        profile,
        cockpitRoute: createCockpitAuthorizationCentreRouteRegistration(),
        cockpitView: buildCockpitConnectionRegistryView({ profile }),
      };
    },
  },
  {
    name: "initialize_connection_registry",
    description: "G8-01 — Initialize connection registry foundation",
    module: "connection-registry",
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
      initializeConnectionRegistry({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        pillowGovernance: true,
      }),
  },
];
