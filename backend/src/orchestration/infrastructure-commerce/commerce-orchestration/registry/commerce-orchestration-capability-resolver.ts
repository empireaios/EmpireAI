/**
 * G2-08 — Commerce coordination capability resolution.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  COMMERCE_COORDINATION_CAPABILITIES,
  COMMERCE_ORCHESTRATION_LIFECYCLE,
  type CommerceCoordinationResolution,
  type CommerceCoordinationCapability,
  type CommerceOrchestrationLifecyclePhase,
  type CommerceParticipatingComponent,
} from "../contracts/commerce-orchestration-types.js";
import { parseCommerceOrchestrationConfiguration } from "../validation/commerce-orchestration-contract-validator.js";
import {
  resolveCommerceOrchestrationRegistrySnapshot,
  resolvePolicyForOrchestration,
} from "./commerce-orchestration-registry-resolver.js";

function resolveCoordinationCapabilities(
  configuration: ReturnType<typeof parseCommerceOrchestrationConfiguration>,
): CommerceCoordinationCapability[] {
  return COMMERCE_COORDINATION_CAPABILITIES.filter(
    (capability) => configuration.domainContracts[capability]?.supported === true,
  );
}

export function resolveCommerceCoordinationCapabilities(
  context: RegistryLoaderContext,
  profileId: string,
  lifecyclePhase: CommerceOrchestrationLifecyclePhase = "discover",
): CommerceCoordinationResolution {
  const snapshot = resolveCommerceOrchestrationRegistrySnapshot(context, {
    registryRowId: profileId,
  });
  const profile = snapshot.profiles[0];
  if (!profile) {
    throw new Error(`Unknown commerce orchestration profile: ${profileId}`);
  }

  const integration = parseCommerceOrchestrationConfiguration(profile.configuration);
  const policy = resolvePolicyForOrchestration(context, profile);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";

  const participatingComponents = integration.participatingComponents
    .filter((entry) => entry.enabled)
    .map((entry) => entry.component as CommerceParticipatingComponent);

  return {
    profileId: profile.id,
    resolvedCapabilities: resolveCoordinationCapabilities(integration),
    participatingComponents,
    lifecyclePhase,
    policyCompliant,
    registryBacked: true,
  };
}

export function resolveAllCommerceCoordinationCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: CommerceOrchestrationLifecyclePhase = "discover",
): CommerceCoordinationResolution[] {
  const snapshot = resolveCommerceOrchestrationRegistrySnapshot(context);
  return snapshot.profiles.map((profile) =>
    resolveCommerceCoordinationCapabilities(context, profile.id, lifecyclePhase),
  );
}

export function listSupportedCommerceOrchestrationLifecyclePhases(): readonly CommerceOrchestrationLifecyclePhase[] {
  return COMMERCE_ORCHESTRATION_LIFECYCLE;
}
