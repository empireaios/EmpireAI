/**
 * G8-08 — Isolation Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";

export type IsolationPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "enforce" | "brain_tool" | "cockpit" | "plugin";
  pillowGovernance: true;
};

export type IsolationPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceBoundary: boolean;
  accountHolderAuthority: boolean;
  delegatedAuthority: boolean;
  providerVisibility: boolean;
  credentialReferenceVisibility: boolean;
  cockpitVisibility: boolean;
  brainToolAccess: boolean;
  pluginAccess: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): IsolationPillowResult {
  return {
    allowed: false,
    reason,
    workspaceBoundary: false,
    accountHolderAuthority: false,
    delegatedAuthority: false,
    providerVisibility: false,
    credentialReferenceVisibility: false,
    cockpitVisibility: false,
    brainToolAccess: false,
    pluginAccess: false,
    eklsGoverned: false,
  };
}

export function validateIsolationPillowGovernance(context: IsolationPillowContext): IsolationPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no isolation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  let providerVisibility = true;
  if (context.providerId) {
    providerVisibility = resolveAllConnectionProviders({ workspaceId: context.workspaceId }).some(
      (p) => p.providerId === context.providerId,
    );
    if (!providerVisibility) {
      return {
        ...deny(`Provider visibility boundary — ${context.providerId}`),
        workspaceBoundary: true,
        accountHolderAuthority: true,
      };
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "multi-workspace-isolation",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceBoundary: true,
      accountHolderAuthority: !!context.accountHolderId,
      delegatedAuthority: true,
      providerVisibility,
      credentialReferenceVisibility: true,
      cockpitVisibility: context.operation === "cockpit",
      brainToolAccess: context.operation === "brain_tool",
      pluginAccess: context.operation === "plugin",
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Isolation Pillow governance passed",
    workspaceBoundary: true,
    accountHolderAuthority: true,
    delegatedAuthority: true,
    providerVisibility,
    credentialReferenceVisibility: true,
    cockpitVisibility: true,
    brainToolAccess: true,
    pluginAccess: true,
    eklsGoverned: true,
  };
}
