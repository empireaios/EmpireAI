/**
 * G2-08 — Commerce orchestration service (discovery, validation, coordination, health).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  CommerceHealthSnapshot,
  CommerceOrchestrationContract,
  CommerceOrchestrationDiscoveryResult,
  CommerceOrchestrationLifecyclePhase,
  CommerceOrchestrationRequest,
  CommerceOrchestrationStateSnapshot,
} from "../contracts/commerce-orchestration-types.js";
import { validateCommerceOrchestrationPillowGovernance } from "../governance/commerce-orchestration-pillow-governance.js";
import { transitionCommerceOrchestrationLifecycle } from "../lifecycle/commerce-orchestration-lifecycle.js";
import { resolveAllCommerceCoordinationCapabilities } from "../registry/commerce-orchestration-capability-resolver.js";
import {
  resolveCommerceOrchestrationRegistrySnapshot,
  verifyOrchestrationRegistryRefs,
} from "../registry/commerce-orchestration-registry-resolver.js";
import {
  assertUniqueOrchestrationProfileIds,
  buildCommerceOrchestrationContract,
  validateCommerceOrchestrationRequest,
} from "../validation/commerce-orchestration-contract-validator.js";
import { buildCommerceOrchestrationDomainContractBundle } from "./commerce-orchestration-domain-contract-service.js";
import {
  getOrchestrationLifecyclePhase,
  getOrchestrationStateSnapshot,
  initOrchestrationState,
  updateOrchestrationState,
} from "../state/commerce-orchestration-state-manager.js";
import { parseCommerceOrchestrationConfiguration } from "../validation/commerce-orchestration-contract-validator.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverCommerceOrchestrationProfiles(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): CommerceOrchestrationDiscoveryResult {
  const snapshot = resolveCommerceOrchestrationRegistrySnapshot(context, query);
  const profiles = snapshot.profiles.map((row) => buildCommerceOrchestrationContract(row));
  assertUniqueOrchestrationProfileIds(profiles);

  return {
    discoveredCount: profiles.length,
    profiles,
    generatedAt: nowIso(),
    discoverySource: "CommerceOrchestrationCatalog:registry-backed",
  };
}

export function validateCommerceOrchestrationProfile(
  context: RegistryLoaderContext,
  profileId: string,
): { valid: boolean; contract?: CommerceOrchestrationContract; reason: string } {
  const snapshot = resolveCommerceOrchestrationRegistrySnapshot(context, {
    registryRowId: profileId,
  });
  const row = snapshot.profiles[0];
  if (!row) {
    return { valid: false, reason: `Orchestration profile not found: ${profileId}` };
  }

  const refs = verifyOrchestrationRegistryRefs(context, row);
  if (!refs.valid) {
    return {
      valid: false,
      reason: `Registry ref verification failed: ${refs.missingRefs.join(", ")}`,
    };
  }

  try {
    const contract = buildCommerceOrchestrationContract(row);
    buildCommerceOrchestrationDomainContractBundle(context, row);
    return { valid: true, contract, reason: "Commerce orchestration profile validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function prepareCommerceOrchestration(input: {
  context: RegistryLoaderContext;
  profileId: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  commerceContext: string;
  actorId: string;
  pillowGovernance: true;
  brainRouted: true;
}): {
  accepted: boolean;
  orchestrationId?: string;
  request?: CommerceOrchestrationRequest;
  state?: CommerceOrchestrationStateSnapshot;
  reason: string;
} {
  const validation = validateCommerceOrchestrationProfile(input.context, input.profileId);
  if (!validation.valid || !validation.contract) {
    return { accepted: false, reason: validation.reason };
  }

  const governance = validateCommerceOrchestrationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    profileId: input.profileId,
    operation: "prepare",
    pillowGovernance: true,
    brainRouted: true,
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const orchestrationId = randomUUID();
  const integration = parseCommerceOrchestrationConfiguration(
    resolveCommerceOrchestrationRegistrySnapshot(input.context, {
      registryRowId: input.profileId,
    }).profiles[0]!.configuration,
  );

  const request = validateCommerceOrchestrationRequest({
    orchestrationId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    brandId: input.brandId,
    commerceContext: input.commerceContext,
    correlationId: randomUUID(),
    executionScope: integration.executionScope,
    participatingComponents: integration.participatingComponents
      .filter((entry) => entry.enabled)
      .map((entry) => entry.component),
    registryReferences: integration.participatingComponents
      .filter((entry) => entry.enabled)
      .map((entry) => entry.registryRef),
    executionState: "prepared",
    timestamp: nowIso(),
    pillowGovernance: true,
    brainRouted: true,
  });

  const state = initOrchestrationState({
    orchestrationId,
    profileId: input.profileId,
    correlationId: request.correlationId,
    participatingComponents: request.participatingComponents,
  });

  updateOrchestrationState({
    orchestrationId,
    lifecyclePhase: "prepare",
    executionState: "prepared",
  });

  return {
    accepted: true,
    orchestrationId,
    request,
    state: getOrchestrationStateSnapshot(orchestrationId),
    reason: "Commerce orchestration prepared — Business Automation decides WHAT; orchestration decides HOW",
  };
}

export function getCommerceOrchestrationHealthSnapshot(
  context: RegistryLoaderContext,
  profileId: string,
  orchestrationId?: string,
): CommerceHealthSnapshot {
  const capabilities = resolveAllCommerceCoordinationCapabilities(context).find(
    (entry) => entry.profileId === profileId,
  );
  const phase = orchestrationId
    ? getOrchestrationLifecyclePhase(orchestrationId)
    : ("discover" as CommerceOrchestrationLifecyclePhase);

  return {
    profileId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceCommerceOrchestrationLifecycle(input: {
  actorId: string;
  workspaceId: string;
  profileId: string;
  orchestrationId: string;
  targetPhase: CommerceOrchestrationLifecyclePhase;
  pillowGovernance: true;
  brainRouted: true;
}): ReturnType<typeof transitionCommerceOrchestrationLifecycle> {
  const governance = validateCommerceOrchestrationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    profileId: input.profileId,
    operation: input.targetPhase === "archive" ? "archive" : input.targetPhase,
    pillowGovernance: true,
    brainRouted: true,
  });

  if (!governance.allowed) {
    const currentPhase = getOrchestrationLifecyclePhase(input.orchestrationId);
    return {
      profileId: input.profileId,
      orchestrationId: input.orchestrationId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = getOrchestrationLifecyclePhase(input.orchestrationId);
  const result = transitionCommerceOrchestrationLifecycle(currentPhase, input);

  if (result.allowed) {
    updateOrchestrationState({
      orchestrationId: input.orchestrationId,
      lifecyclePhase: result.currentPhase,
      executionState:
        result.currentPhase === "complete"
          ? "completed"
          : result.currentPhase === "recover"
            ? "recovering"
            : result.currentPhase === "coordinate"
              ? "coordinating"
              : undefined,
    });
  }

  return result;
}

export function resetCommerceOrchestrationIntegrationStateForTests(): void {
  // delegated to state manager reset via index
}
