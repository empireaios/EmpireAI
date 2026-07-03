/**
 * G8-06 — Operational Readiness Engine Brain tools.
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInReadinessPayload,
  redactReadinessSecrets,
} from "../contracts/readiness-types.js";
import {
  evaluateReadinessForAccountHolder,
  evaluateReadinessForAutomation,
  evaluateReadinessForProvider,
  evaluateReadinessForWorkflow,
  evaluateReadinessForWorkspace,
  evaluateReadinessOverview,
  getReadinessBlockers,
  getReadinessRecommendations,
} from "../services/operational-readiness-service.js";

function safePayload(value: unknown) {
  const redacted = redactReadinessSecrets(value);
  assertNoSecretsInReadinessPayload(redacted);
  return redacted;
}

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  pillowGovernance: true as const,
};

export const operationalReadinessTools: RegisteredTool[] = [
  {
    name: "readiness_overview",
    description: "G8-06 — Operational readiness overview for workspace (registry-driven, secrets redacted)",
    module: "operational-readiness-engine",
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
        evaluateReadinessOverview({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_for_workspace",
    description: "G8-06 — Workspace operational readiness evaluation",
    module: "operational-readiness-engine",
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
        evaluateReadinessForWorkspace({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_for_account_holder",
    description: "G8-06 — Account holder operational readiness evaluation",
    module: "operational-readiness-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["accountHolderId"],
    },
    handler: async (args, context) =>
      safePayload(
        evaluateReadinessForAccountHolder({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          accountHolderId: String(args.accountHolderId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_for_provider",
    description: "G8-06 — Provider operational readiness (Can Amazon/Stripe/Shopify run?)",
    module: "operational-readiness-engine",
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
        evaluateReadinessForProvider({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          providerId: String(args.providerId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_for_workflow",
    description: "G8-06 — Workflow readiness (Can this workflow run?)",
    module: "operational-readiness-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        workflowId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["workflowId"],
    },
    handler: async (args, context) =>
      safePayload(
        evaluateReadinessForWorkflow({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          workflowId: String(args.workflowId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_for_automation",
    description: "G8-06 — Automation readiness (Can this automation execute?)",
    module: "operational-readiness-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        automationId: { type: "string" },
        actorId: { type: "string" },
        ownerId: { type: "string" },
      },
      required: ["automationId"],
    },
    handler: async (args, context) =>
      safePayload(
        evaluateReadinessForAutomation({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          automationId: String(args.automationId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_blockers",
    description: "G8-06 — List readiness blockers and missing connections",
    module: "operational-readiness-engine",
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
        getReadinessBlockers({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "readiness_recommendations",
    description: "G8-06 — Readiness recommendations and next required actions",
    module: "operational-readiness-engine",
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
        getReadinessRecommendations({
          actorId: String(args.actorId ?? "grand-king"),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? context.workspaceId),
          pillowGovernance: true,
        }),
      ),
  },
];
