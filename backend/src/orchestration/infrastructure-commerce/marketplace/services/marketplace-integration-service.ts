/**
 * G2-02 — Marketplace integration service (discovery, validation, health monitoring).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  MarketplaceAdapterContract,
  MarketplaceDiscoveryResult,
  MarketplaceHealthSnapshot,
  MarketplaceIntegrationLifecyclePhase,
} from "../contracts/marketplace-integration-types.js";
import { validateMarketplacePillowGovernance } from "../governance/marketplace-pillow-governance.js";
import { transitionMarketplaceLifecycle } from "../lifecycle/marketplace-integration-lifecycle.js";
import { resolveAllMarketplaceCapabilities } from "../registry/marketplace-capability-resolver.js";
import { resolveMarketplaceRegistrySnapshot } from "../registry/marketplace-registry-resolver.js";
import {
  assertUniqueMarketplaceIds,
  buildMarketplaceAdapterContract,
} from "../validation/marketplace-contract-validator.js";
import { buildMarketplaceDomainContractBundle } from "./marketplace-domain-contract-service.js";

const lifecycleState = new Map<string, MarketplaceIntegrationLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverMarketplaces(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): MarketplaceDiscoveryResult {
  const snapshot = resolveMarketplaceRegistrySnapshot(context, query);
  const marketplaces = snapshot.marketplaces.map((row) =>
    buildMarketplaceAdapterContract(row, "unknown", "validated"),
  );
  assertUniqueMarketplaceIds(marketplaces);

  for (const marketplace of marketplaces) {
    if (!lifecycleState.has(marketplace.marketplaceId)) {
      lifecycleState.set(marketplace.marketplaceId, "discover");
    }
  }

  return {
    discoveredCount: marketplaces.length,
    marketplaces,
    generatedAt: nowIso(),
    discoverySource: "RegistryLoader:REG-MARKETPLACE",
  };
}

export function validateMarketplaceIntegration(
  context: RegistryLoaderContext,
  marketplaceId: string,
): { valid: boolean; contract?: MarketplaceAdapterContract; reason: string } {
  const snapshot = resolveMarketplaceRegistrySnapshot(context, { registryRowId: marketplaceId });
  const row = snapshot.marketplaces[0];
  if (!row) {
    return {
      valid: false,
      reason: `Marketplace registry row not found: ${marketplaceId}`,
    };
  }

  try {
    const contract = buildMarketplaceAdapterContract(row);
    buildMarketplaceDomainContractBundle(context, row);
    lifecycleState.set(marketplaceId, "validate");
    return { valid: true, contract, reason: "Marketplace integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function getMarketplaceHealthSnapshot(
  context: RegistryLoaderContext,
  marketplaceId: string,
): MarketplaceHealthSnapshot {
  const capabilities = resolveAllMarketplaceCapabilities(context).find(
    (entry) => entry.marketplaceId === marketplaceId,
  );
  const phase = lifecycleState.get(marketplaceId) ?? "discover";

  return {
    marketplaceId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceMarketplaceLifecycle(input: {
  actorId: string;
  workspaceId: string;
  marketplaceId: string;
  targetPhase: MarketplaceIntegrationLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionMarketplaceLifecycle> {
  const governance = validateMarketplacePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    marketplaceId: input.marketplaceId,
    operation: input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.marketplaceId) ?? "discover";
    return {
      marketplaceId: input.marketplaceId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.marketplaceId) ?? "discover";
  const result = transitionMarketplaceLifecycle(currentPhase, {
    marketplaceId: input.marketplaceId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.marketplaceId, result.currentPhase);
  }

  return result;
}

export function resetMarketplaceIntegrationStateForTests(): void {
  lifecycleState.clear();
}
