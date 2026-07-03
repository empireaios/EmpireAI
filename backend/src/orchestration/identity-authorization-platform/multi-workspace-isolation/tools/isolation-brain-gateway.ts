/**
 * G8-08 — Brain tool isolation gateway (wraps all G8 IAP tools).
 */

import type { RegisteredTool, ToolContext } from "../../../../brain/types.js";
import type { IsolationActorContext } from "../contracts/isolation-types.js";
import {
  assertNoSecretsInIsolationPayload,
  redactIsolationSecrets,
} from "../contracts/isolation-types.js";
import {
  enforceBrainToolIsolation,
  wrapBrainToolResult,
} from "../services/isolation-enforcement-service.js";
import { resolveAccountHolderProfile } from "../registry/isolation-policy-resolver.js";

function parseActor(args: Record<string, unknown>, context: ToolContext): IsolationActorContext {
  const actorWorkspaceId = String(context.workspaceId);
  const accountHolderId = String(args.accountHolderId ?? "grand-king");
  const holderProfile = resolveAccountHolderProfile(accountHolderId, { workspaceId: actorWorkspaceId });
  return {
    actorId: String(args.actorId ?? context.agentId ?? "grand-king"),
    workspaceId: actorWorkspaceId,
    ownerId: String(args.ownerId ?? "grand-king"),
    accountHolderId,
    accountHolderTypeId: String(args.accountHolderTypeId ?? holderProfile?.accountHolderTypeId ?? accountHolderId),
    companyId: args.companyId ? String(args.companyId) : undefined,
    brandId: args.brandId ? String(args.brandId) : undefined,
    pillowGovernance: true,
  };
}

function safePayload(value: unknown) {
  const redacted = redactIsolationSecrets(value);
  assertNoSecretsInIsolationPayload(redacted);
  return redacted;
}

export function wrapG8BrainToolsWithIsolation(tools: RegisteredTool[]): RegisteredTool[] {
  return tools.map((tool) => ({
    ...tool,
    handler: async (args: Record<string, unknown>, context: ToolContext) => {
      const actor = parseActor(args, context);
      const targetWorkspaceId = String(args.workspaceId ?? context.workspaceId);
      const isolation = enforceBrainToolIsolation({
        toolName: tool.name,
        actor,
        targetWorkspaceId,
        targetAccountHolderId: args.accountHolderId ? String(args.accountHolderId) : undefined,
        targetProviderId: args.providerId ? String(args.providerId) : undefined,
      });

      if (!isolation.allowed) {
        return safePayload({
          isolationBlocked: true,
          accessDecision: isolation.accessDecision,
          reason: isolation.reason,
          correlationId: isolation.correlationId,
          governanceState: "pillow-governed",
        });
      }

      const result = await tool.handler(args, context);
      return safePayload(wrapBrainToolResult(result, isolation.visibilityScope));
    },
  }));
}
