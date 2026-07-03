/**
 * G8-00 — Identity & Authorization Platform Pillow governance gateway.
 */

import { FOUNDATION_PROVIDER_IDS } from "../../../registry/types/identity-authorization-registry-types.js";
import { IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS } from "../../../registry/types/registry-ids.js";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import { listIdentityPlatformRegistryIds } from "../registry/identity-authorization-registry-resolver.js";

export type IdentityAuthorizationPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  operation: "overview" | "load" | "configure" | "authorize" | "override_request";
  pillowGovernance: true;
};

export type IdentityAuthorizationPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceValidated: boolean;
  ownershipValidated: boolean;
  providerEligibility: boolean;
  registryCompliance: boolean;
  constitutionalCompliance: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): IdentityAuthorizationPillowResult {
  return {
    allowed: false,
    reason,
    workspaceValidated: false,
    ownershipValidated: false,
    providerEligibility: false,
    registryCompliance: false,
    constitutionalCompliance: false,
    eklsGoverned: false,
  };
}

export function validateIdentityAuthorizationPillowGovernance(
  context: IdentityAuthorizationPillowContext,
): IdentityAuthorizationPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no identity provider bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king") {
    return deny("Grand King workspace ownership required");
  }

  const registryIds = listIdentityPlatformRegistryIds();
  const registryCompliance =
    registryIds.length === IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS.length &&
    IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS.every((id) => registryIds.includes(id));

  if (!registryCompliance) {
    return {
      ...deny("Registry compliance failed — canonical IAP registries incomplete"),
      workspaceValidated: true,
      ownershipValidated: true,
      registryCompliance: false,
      constitutionalCompliance: true,
    };
  }

  const providerEligibility =
    !context.providerId || (FOUNDATION_PROVIDER_IDS as readonly string[]).includes(context.providerId);

  if (!providerEligibility) {
    return {
      ...deny(`Provider eligibility failed — ${context.providerId} not in foundation registry`),
      workspaceValidated: true,
      ownershipValidated: true,
      providerEligibility: false,
      registryCompliance: true,
      constitutionalCompliance: true,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "identity-authorization",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceValidated: true,
      ownershipValidated: true,
      providerEligibility,
      registryCompliance: true,
      constitutionalCompliance: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Identity & Authorization Platform Pillow governance passed",
    workspaceValidated: true,
    ownershipValidated: true,
    providerEligibility,
    registryCompliance: true,
    constitutionalCompliance: true,
    eklsGoverned: true,
  };
}
