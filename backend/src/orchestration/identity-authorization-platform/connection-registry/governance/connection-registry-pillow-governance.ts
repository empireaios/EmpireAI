/**
 * G8-01 — Connection Registry Pillow governance.
 */

import { CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS } from "../../../../registry/types/registry-ids.js";
import { CONNECTION_REGISTRY_PROVIDER_IDS } from "../../../../registry/types/connection-registry-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { listConnectionRegistryIds } from "../registry/connection-registry-resolver.js";

export type ConnectionRegistryPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "overview" | "resolve" | "register" | "validate";
  pillowGovernance: true;
};

export type ConnectionRegistryPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceOwnership: boolean;
  accountHolderEligibility: boolean;
  providerEligibility: boolean;
  permissionBoundary: boolean;
  registryCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ConnectionRegistryPillowResult {
  return {
    allowed: false,
    reason,
    workspaceOwnership: false,
    accountHolderEligibility: false,
    providerEligibility: false,
    permissionBoundary: false,
    registryCompliance: false,
    eklsGoverned: false,
  };
}

export function validateConnectionRegistryPillowGovernance(
  context: ConnectionRegistryPillowContext,
): ConnectionRegistryPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no connection registry bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "overview") {
    return deny("Workspace ownership validation failed");
  }

  const registryIds = listConnectionRegistryIds();
  const registryCompliance =
    registryIds.length === CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS.length &&
    CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS.every((id) => registryIds.includes(id));

  if (!registryCompliance) {
    return {
      ...deny("Registry compliance failed — canonical connection registries incomplete"),
      workspaceOwnership: true,
      registryCompliance: false,
    };
  }

  const providerEligibility =
    !context.providerId ||
    (CONNECTION_REGISTRY_PROVIDER_IDS as readonly string[]).includes(context.providerId);

  if (!providerEligibility) {
    return {
      ...deny(`Provider eligibility failed — ${context.providerId} not in connection registry`),
      workspaceOwnership: true,
      providerEligibility: false,
      registryCompliance: true,
    };
  }

  const accountHolderEligibility = !context.accountHolderId || context.accountHolderId.length > 0;

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "connection-registry",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceOwnership: true,
      accountHolderEligibility,
      providerEligibility,
      permissionBoundary: true,
      registryCompliance: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Connection Registry Pillow governance passed",
    workspaceOwnership: true,
    accountHolderEligibility,
    providerEligibility,
    permissionBoundary: true,
    registryCompliance: true,
    eklsGoverned: true,
  };
}
