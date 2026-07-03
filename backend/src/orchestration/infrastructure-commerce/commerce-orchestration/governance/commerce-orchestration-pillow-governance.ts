/**
 * G2-08 — Pillow governance for commerce orchestration.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  CommerceOrchestrationLifecyclePhase,
  CommerceOrchestrationPluginManifest,
  CommerceOrchestrationRequest,
} from "../contracts/commerce-orchestration-types.js";
import {
  buildCommerceOrchestrationContract,
  validateCommerceOrchestrationRequest,
} from "../validation/commerce-orchestration-contract-validator.js";
import { getCommerceOrchestrationProfileById } from "../data/commerce-orchestration-profile-store.js";
import {
  resolvePolicyForOrchestration,
  verifyOrchestrationRegistryRefs,
} from "../registry/commerce-orchestration-registry-resolver.js";

export type CommerceOrchestrationPillowContext = RegistryLoaderContext & {
  actorId: string;
  profileId: string;
  operation:
    | "discover"
    | "validate"
    | "prepare"
    | "coordinate"
    | "synchronise"
    | "monitor"
    | "complete"
    | "recover"
    | "archive";
  lifecyclePhase?: CommerceOrchestrationLifecyclePhase;
  pillowGovernance: true;
  brainRouted: true;
};

export type CommerceOrchestrationPillowResult = {
  allowed: boolean;
  reason: string;
  executionAuthorized: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  operationalCompliant: boolean;
  eklsGoverned: boolean;
};

export function validateCommerceOrchestrationPluginManifest(
  manifest: CommerceOrchestrationPluginManifest,
): CommerceOrchestrationPillowResult {
  if (!manifest.pillowGovernance) {
    return deny("Commerce orchestration plugins require pillowGovernance: true");
  }
  if (!manifest.pluginId?.trim() || !manifest.orchestrationProfileId?.trim()) {
    return deny("Plugin manifest requires pluginId and orchestrationProfileId");
  }
  return {
    allowed: true,
    reason: "Commerce orchestration plugin manifest valid",
    executionAuthorized: false,
    policyCompliant: false,
    workspaceIsolated: false,
    operationalCompliant: false,
    eklsGoverned: false,
  };
}

function deny(reason: string): CommerceOrchestrationPillowResult {
  return {
    allowed: false,
    reason,
    executionAuthorized: false,
    policyCompliant: false,
    workspaceIsolated: false,
    operationalCompliant: false,
    eklsGoverned: false,
  };
}

export function validateCommerceOrchestrationPillowGovernance(
  context: CommerceOrchestrationPillowContext,
): CommerceOrchestrationPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required");
  }
  if (!context.brainRouted) {
    return deny("Commerce orchestration must be Brain-routed");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  const profile = getCommerceOrchestrationProfileById(context.profileId);
  if (!profile) {
    return deny(`Orchestration profile not found: ${context.profileId}`);
  }

  const policy = resolvePolicyForOrchestration(context, profile);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";
  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Commerce policy compliance check failed",
      executionAuthorized: false,
      policyCompliant: false,
      workspaceIsolated: true,
      operationalCompliant: false,
      eklsGoverned: false,
    };
  }

  const refs = verifyOrchestrationRegistryRefs(context, profile);
  if (!refs.valid) {
    return {
      allowed: false,
      reason: `Missing registry refs: ${refs.missingRefs.join(", ")}`,
      executionAuthorized: false,
      policyCompliant: true,
      workspaceIsolated: true,
      operationalCompliant: false,
      eklsGoverned: false,
    };
  }

  buildCommerceOrchestrationContract(profile);

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: "retrieve",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      executionAuthorized: true,
      policyCompliant: true,
      workspaceIsolated: false,
      operationalCompliant: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Commerce orchestration Pillow governance passed",
    executionAuthorized: true,
    policyCompliant: true,
    workspaceIsolated: true,
    operationalCompliant: true,
    eklsGoverned: true,
  };
}

export function validateOrchestrationRequestGovernance(
  context: RegistryLoaderContext,
  request: CommerceOrchestrationRequest,
  profileId: string,
): CommerceOrchestrationPillowResult {
  try {
    validateCommerceOrchestrationRequest(request);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return deny(reason);
  }

  if (!request.brainRouted || !request.pillowGovernance) {
    return deny("Orchestration request requires pillowGovernance and brainRouted");
  }

  return validateCommerceOrchestrationPillowGovernance({
    ...context,
    actorId: "orchestration-request",
    workspaceId: request.workspaceId,
    companyId: request.companyId,
    profileId,
    operation: "coordinate",
    pillowGovernance: true,
    brainRouted: true,
  });
}
