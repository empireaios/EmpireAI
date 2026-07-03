/**
 * G2-06 — Logistics integration service (discovery, validation, health, lifecycle).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  LogisticsAdapterContract,
  LogisticsDiscoveryResult,
  LogisticsHealthSnapshot,
  LogisticsShipmentLifecyclePhase,
} from "../contracts/logistics-integration-types.js";
import { validateLogisticsPillowGovernance } from "../governance/logistics-pillow-governance.js";
import { transitionLogisticsLifecycle } from "../lifecycle/logistics-integration-lifecycle.js";
import { resolveAllLogisticsCapabilities } from "../registry/logistics-capability-resolver.js";
import { resolveLogisticsRegistrySnapshot } from "../registry/logistics-registry-resolver.js";
import {
  assertUniqueLogisticsProviderIds,
  buildLogisticsAdapterContract,
} from "../validation/logistics-contract-validator.js";
import { buildLogisticsDomainContractBundle } from "./logistics-domain-contract-service.js";

const lifecycleState = new Map<string, LogisticsShipmentLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverLogisticsProviders(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): LogisticsDiscoveryResult {
  const snapshot = resolveLogisticsRegistrySnapshot(context, query);
  const providers = snapshot.logistics.map((row) =>
    buildLogisticsAdapterContract(row, "unknown", "validated"),
  );
  assertUniqueLogisticsProviderIds(providers);

  for (const provider of providers) {
    if (!lifecycleState.has(provider.providerId)) {
      lifecycleState.set(provider.providerId, "discover");
    }
  }

  return {
    discoveredCount: providers.length,
    providers,
    generatedAt: nowIso(),
    discoverySource: "RegistryLoader:REG-LOGISTICS",
  };
}

export function validateLogisticsIntegration(
  context: RegistryLoaderContext,
  providerId: string,
): { valid: boolean; contract?: LogisticsAdapterContract; reason: string } {
  const snapshot = resolveLogisticsRegistrySnapshot(context, { registryRowId: providerId });
  const row = snapshot.logistics[0];
  if (!row) {
    return {
      valid: false,
      reason: `Logistics registry row not found: ${providerId}`,
    };
  }

  try {
    const contract = buildLogisticsAdapterContract(row);
    buildLogisticsDomainContractBundle(context, row);
    lifecycleState.set(providerId, "validate");
    return { valid: true, contract, reason: "Logistics integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function getLogisticsHealthSnapshot(
  context: RegistryLoaderContext,
  providerId: string,
): LogisticsHealthSnapshot {
  const capabilities = resolveAllLogisticsCapabilities(context).find(
    (entry) => entry.providerId === providerId,
  );
  const phase = lifecycleState.get(providerId) ?? "discover";

  return {
    providerId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceLogisticsLifecycle(input: {
  actorId: string;
  workspaceId: string;
  providerId: string;
  targetPhase: LogisticsShipmentLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionLogisticsLifecycle> {
  const governance = validateLogisticsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    operation: input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.providerId) ?? "discover";
    return {
      providerId: input.providerId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.providerId) ?? "discover";
  const result = transitionLogisticsLifecycle(currentPhase, {
    providerId: input.providerId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.providerId, result.currentPhase);
  }

  return result;
}

export function resetLogisticsIntegrationStateForTests(): void {
  lifecycleState.clear();
}
