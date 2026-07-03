/**
 * G8-08 — Multi-Workspace Isolation Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInIsolationPayload,
  redactIsolationSecrets,
} from "../contracts/isolation-types.js";
import {
  buildIdentityVisibilityMatrix,
  checkIdentityIsolation,
  getAccountHolderConnectionScope,
  getCredentialReferenceVisibility,
  getWorkspaceAuthorizationScope,
} from "../services/isolation-enforcement-service.js";

function safePayload(value: unknown) {
  const redacted = redactIsolationSecrets(value);
  assertNoSecretsInIsolationPayload(redacted);
  return redacted;
}

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  accountHolderTypeId: "grand-king",
  pillowGovernance: true as const,
};

export const isolationTools: RegisteredTool[] = [
  {
    name: "identity_isolation_check",
    description: "G8-08 — Check identity isolation boundary for workspace/account holder",
    module: "multi-workspace-isolation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        targetWorkspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        targetAccountHolderId: { type: "string" },
        providerId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        checkIdentityIsolation({
          actor: {
            ...DEFAULT_ACTOR,
            actorId: String(args.actorId ?? "grand-king"),
            ownerId: String(args.ownerId ?? "grand-king"),
            workspaceId: String(args.workspaceId ?? context.workspaceId),
            accountHolderId: String(args.accountHolderId ?? "grand-king"),
          },
          targetWorkspaceId: String(args.targetWorkspaceId ?? args.workspaceId ?? context.workspaceId),
          targetAccountHolderId: args.targetAccountHolderId ? String(args.targetAccountHolderId) : undefined,
          targetProviderId: args.providerId ? String(args.providerId) : undefined,
        }),
      ),
  },
  {
    name: "identity_visibility_matrix",
    description: "G8-08 — Identity visibility matrix for account holders and providers",
    module: "multi-workspace-isolation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        accountHolderTypeId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        buildIdentityVisibilityMatrix({
          actor: {
            ...DEFAULT_ACTOR,
            actorId: String(args.actorId ?? "grand-king"),
            ownerId: String(args.ownerId ?? "grand-king"),
            workspaceId: String(args.workspaceId ?? context.workspaceId),
            accountHolderId: String(args.accountHolderId ?? "grand-king"),
            accountHolderTypeId: String(args.accountHolderTypeId ?? args.accountHolderId ?? "grand-king"),
          },
        }),
      ),
  },
  {
    name: "account_holder_connection_scope",
    description: "G8-08 — Account holder connection scope (isolated credential and auth counts)",
    module: "multi-workspace-isolation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        accountHolderTypeId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getAccountHolderConnectionScope({
          actor: {
            ...DEFAULT_ACTOR,
            actorId: String(args.actorId ?? "grand-king"),
            ownerId: String(args.ownerId ?? "grand-king"),
            workspaceId: String(args.workspaceId ?? context.workspaceId),
            accountHolderId: String(args.accountHolderId ?? "grand-king"),
            accountHolderTypeId: String(args.accountHolderTypeId ?? args.accountHolderId ?? "grand-king"),
          },
          accountHolderTypeId: args.accountHolderTypeId ? String(args.accountHolderTypeId) : undefined,
        }),
      ),
  },
  {
    name: "workspace_authorization_scope",
    description: "G8-08 — Workspace authorization scope with isolation filtering",
    module: "multi-workspace-isolation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getWorkspaceAuthorizationScope({
          actor: {
            ...DEFAULT_ACTOR,
            actorId: String(args.actorId ?? "grand-king"),
            ownerId: String(args.ownerId ?? "grand-king"),
            workspaceId: String(args.workspaceId ?? context.workspaceId),
            accountHolderId: String(args.accountHolderId ?? "grand-king"),
          },
        }),
      ),
  },
  {
    name: "credential_reference_visibility",
    description: "G8-08 — Visible credential references for isolation boundary",
    module: "multi-workspace-isolation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
        accountHolderId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getCredentialReferenceVisibility({
          actor: {
            ...DEFAULT_ACTOR,
            actorId: String(args.actorId ?? "grand-king"),
            ownerId: String(args.ownerId ?? "grand-king"),
            workspaceId: String(args.workspaceId ?? context.workspaceId),
            accountHolderId: String(args.accountHolderId ?? "grand-king"),
          },
          providerId: args.providerId ? String(args.providerId) : undefined,
        }),
      ),
  },
];
