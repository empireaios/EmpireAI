/**
 * G2-04 — Storefront integration service (discovery, validation, provisioning, health, lifecycle).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  StorefrontAdapterContract,
  StorefrontDiscoveryResult,
  StorefrontHealthSnapshot,
  StorefrontIntegrationLifecyclePhase,
  StorefrontProvisioningValidationResult,
} from "../contracts/storefront-integration-types.js";
import { validateStorefrontPillowGovernance } from "../governance/storefront-pillow-governance.js";
import { transitionStorefrontLifecycle } from "../lifecycle/storefront-integration-lifecycle.js";
import { resolveAllStorefrontCapabilities } from "../registry/storefront-capability-resolver.js";
import {
  resolveBrandForStorefront,
  resolveCategoryForStorefront,
  resolveStorefrontRegistrySnapshot,
} from "../registry/storefront-registry-resolver.js";
import {
  assertUniqueStorefrontIds,
  buildStorefrontAdapterContract,
  parseStorefrontIntegrationConfiguration,
} from "../validation/storefront-contract-validator.js";
import { buildStorefrontDomainContractBundle } from "./storefront-domain-contract-service.js";

const lifecycleState = new Map<string, StorefrontIntegrationLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverStorefronts(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): StorefrontDiscoveryResult {
  const snapshot = resolveStorefrontRegistrySnapshot(context, query);
  const storefronts = snapshot.storefronts.map((row) =>
    buildStorefrontAdapterContract(row, "unknown", "validated"),
  );
  assertUniqueStorefrontIds(storefronts);

  for (const storefront of storefronts) {
    if (!lifecycleState.has(storefront.storefrontId)) {
      lifecycleState.set(storefront.storefrontId, "discover");
    }
  }

  return {
    discoveredCount: storefronts.length,
    storefronts,
    generatedAt: nowIso(),
    discoverySource: "RegistryLoader:REG-STOREFRONT",
  };
}

export function validateStorefrontIntegration(
  context: RegistryLoaderContext,
  storefrontId: string,
): { valid: boolean; contract?: StorefrontAdapterContract; reason: string } {
  const snapshot = resolveStorefrontRegistrySnapshot(context, { registryRowId: storefrontId });
  const row = snapshot.storefronts[0];
  if (!row) {
    return {
      valid: false,
      reason: `Storefront registry row not found: ${storefrontId}`,
    };
  }

  try {
    const contract = buildStorefrontAdapterContract(row);
    buildStorefrontDomainContractBundle(context, row);
    lifecycleState.set(storefrontId, "validate");
    return { valid: true, contract, reason: "Storefront integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function validateStorefrontProvisioning(
  context: RegistryLoaderContext,
  storefrontId: string,
): StorefrontProvisioningValidationResult {
  const snapshot = resolveStorefrontRegistrySnapshot(context, { registryRowId: storefrontId });
  const row = snapshot.storefronts[0];
  if (!row) {
    return {
      storefrontId,
      valid: false,
      brandAssigned: false,
      categoryAssigned: false,
      provisioningReady: false,
      reason: `Storefront registry row not found: ${storefrontId}`,
    };
  }

  try {
    const integration = parseStorefrontIntegrationConfiguration(row.configuration);
    const brand = resolveBrandForStorefront(context, integration.brandRef);
    const category = resolveCategoryForStorefront(context, integration.categoryRef);
    const brandAssigned = Boolean(brand && integration.domainContracts.brand_assignment.supported);
    const categoryAssigned = Boolean(
      category && integration.domainContracts.collection_management.supported,
    );
    const provisioningReady =
      integration.domainContracts.provisioning.supported &&
      Boolean(row.deploymentRef) &&
      brandAssigned;

    return {
      storefrontId,
      valid: provisioningReady,
      brandAssigned,
      categoryAssigned,
      provisioningReady,
      reason: provisioningReady
        ? "Storefront provisioning contract validated"
        : "Storefront provisioning prerequisites not met",
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      storefrontId,
      valid: false,
      brandAssigned: false,
      categoryAssigned: false,
      provisioningReady: false,
      reason,
    };
  }
}

export function getStorefrontHealthSnapshot(
  context: RegistryLoaderContext,
  storefrontId: string,
): StorefrontHealthSnapshot {
  const capabilities = resolveAllStorefrontCapabilities(context).find(
    (entry) => entry.storefrontId === storefrontId,
  );
  const phase = lifecycleState.get(storefrontId) ?? "discover";

  return {
    storefrontId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceStorefrontLifecycle(input: {
  actorId: string;
  workspaceId: string;
  storefrontId: string;
  targetPhase: StorefrontIntegrationLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionStorefrontLifecycle> {
  const governance = validateStorefrontPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    storefrontId: input.storefrontId,
    operation: input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.storefrontId) ?? "discover";
    return {
      storefrontId: input.storefrontId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.storefrontId) ?? "discover";
  const result = transitionStorefrontLifecycle(currentPhase, {
    storefrontId: input.storefrontId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.storefrontId, result.currentPhase);
  }

  return result;
}

export function resetStorefrontIntegrationStateForTests(): void {
  lifecycleState.clear();
}
