/**
 * G8-07 — Token lifecycle Brain tools (never expose raw secrets).
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInTokenLifecyclePayload,
  redactTokenLifecycleSecrets,
} from "../contracts/token-lifecycle-types.js";
import {
  cancelReauthorization,
  getRefreshEligibility,
  getReauthorizationStatus,
  getTokenExpiryWarnings,
  getTokenLifecycleDetail,
  getTokenLifecycleSummary,
  listReauthorizationRequired,
  startReauthorization,
} from "../services/reauthorization-service.js";

function safePayload(value: unknown) {
  const redacted = redactTokenLifecycleSecrets(value);
  assertNoSecretsInTokenLifecyclePayload(redacted);
  return redacted;
}

export const tokenLifecycleTools: RegisteredTool[] = [
  {
    name: "token_lifecycle_summary",
    description: "G8-07 — Token lifecycle summary for workspace (metadata only, secrets redacted)",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getTokenLifecycleSummary({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "token_lifecycle_detail",
    description: "G8-07 — Token lifecycle detail for a provider",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args, context) =>
      safePayload(
        getTokenLifecycleDetail({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          providerId: String(args.providerId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "reauthorization_required",
    description: "G8-07 — List providers requiring reauthorization",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        listReauthorizationRequired({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "reauthorization_start",
    description: "G8-07 — Start Pillow-governed reauthorization handoff (no live provider call)",
    module: "automatic-reauthorization",
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
      required: ["providerId"],
    },
    handler: async (args, context) =>
      safePayload(
        startReauthorization({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          accountHolderId: String(args.accountHolderId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          providerId: String(args.providerId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "reauthorization_cancel",
    description: "G8-07 — Cancel a reauthorization request",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        reauthorizationId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["reauthorizationId"],
    },
    handler: async (args, context) =>
      safePayload(
        cancelReauthorization({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          reauthorizationId: String(args.reauthorizationId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "reauthorization_status",
    description: "G8-07 — Reauthorization status by id or provider",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        reauthorizationId: { type: "string" },
        providerId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getReauthorizationStatus({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          reauthorizationId: args.reauthorizationId ? String(args.reauthorizationId) : undefined,
          providerId: args.providerId ? String(args.providerId) : undefined,
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "token_expiry_warnings",
    description: "G8-07 — Token expiry warnings (expiring soon)",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      safePayload(
        getTokenExpiryWarnings({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "refresh_eligibility",
    description: "G8-07 — Refresh eligibility for a provider (registry-driven)",
    module: "automatic-reauthorization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args, context) =>
      safePayload(
        getRefreshEligibility({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          providerId: String(args.providerId),
          pillowGovernance: true,
        }),
      ),
  },
];
