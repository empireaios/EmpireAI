/**
 * G8-02 — Authorization Framework Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import { buildCockpitAuthorizationFlowView } from "../contracts/authorization-framework-cockpit-contracts.js";
import {
  cancelAuthorization,
  getAuthorizationRequirements,
  getAuthorizationStatus,
  previewAuthorizationCallback,
  startAuthorization,
  submitAuthorizationCredentials,
  validateAuthorizationResult,
} from "../services/authorization-flow-service.js";

export const authorizationFrameworkTools: RegisteredTool[] = [
  {
    name: "authorization_start",
    description: "G8-02 — Start authorization flow from registry requirements",
    module: "authorization-framework",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        providerId: { type: "string" },
        environment: { type: "string" },
      },
      required: ["actorId", "providerId"],
    },
    handler: async (args) =>
      startAuthorization({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        providerId: String(args.providerId),
        environment: args.environment === "sandbox" ? "sandbox" : "production",
        pillowGovernance: true,
      }),
  },
  {
    name: "authorization_callback_preview",
    description: "G8-02 — Preview OAuth callback (secrets redacted)",
    module: "authorization-framework",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        authorizationId: { type: "string" },
      },
      required: ["actorId", "authorizationId"],
    },
    handler: async (args) =>
      previewAuthorizationCallback({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        authorizationId: String(args.authorizationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "authorization_submit_credentials",
    description: "G8-02 — Submit API credentials (vault reference only)",
    module: "authorization-framework",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        authorizationId: { type: "string" },
        credentialKind: { type: "string" },
      },
      required: ["actorId", "authorizationId"],
    },
    handler: async (args) =>
      submitAuthorizationCredentials({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        authorizationId: String(args.authorizationId),
        credentialKind: (args.credentialKind as "api_key") ?? "api_key",
        pillowGovernance: true,
      }),
  },
  {
    name: "authorization_validate_result",
    description: "G8-02 — Validate authorization result from registry",
    module: "authorization-framework",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        authorizationId: { type: "string" },
        partial: { type: "boolean" },
      },
      required: ["actorId", "authorizationId"],
    },
    handler: async (args) =>
      validateAuthorizationResult({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        authorizationId: String(args.authorizationId),
        partial: Boolean(args.partial),
        pillowGovernance: true,
      }),
  },
  {
    name: "authorization_status",
    description: "G8-02 — Authorization flow status",
    module: "authorization-framework",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { authorizationId: { type: "string" } },
      required: ["authorizationId"],
    },
    handler: async (args) => {
      const status = getAuthorizationStatus(String(args.authorizationId));
      return {
        ...status,
        cockpitView: buildCockpitAuthorizationFlowView({
          request: status.request,
          result: status.result,
        }),
      };
    },
  },
  {
    name: "authorization_cancel",
    description: "G8-02 — Cancel authorization flow",
    module: "authorization-framework",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        authorizationId: { type: "string" },
      },
      required: ["actorId", "authorizationId"],
    },
    handler: async (args) => ({
      request: cancelAuthorization({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        authorizationId: String(args.authorizationId),
        pillowGovernance: true,
      }),
    }),
  },
  {
    name: "authorization_requirements",
    description: "G8-02 — Provider authorization requirements from registry",
    module: "authorization-framework",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        providerId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args) => ({
      requirements: getAuthorizationRequirements(String(args.providerId), {
        workspaceId: String(args.workspaceId ?? "ws_empire_1"),
      }),
    }),
  },
];
