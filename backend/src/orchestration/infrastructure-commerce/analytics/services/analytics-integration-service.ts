/**
 * G2-07 — Analytics integration service (discovery, validation, health, lifecycle).
 */

import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import type {
  AnalyticsAdapterContract,
  AnalyticsDiscoveryResult,
  AnalyticsHealthSnapshot,
  AnalyticsMetricLifecyclePhase,
} from "../contracts/analytics-integration-types.js";
import { validateAnalyticsPillowGovernance } from "../governance/analytics-pillow-governance.js";
import { transitionAnalyticsLifecycle } from "../lifecycle/analytics-metric-lifecycle.js";
import { resolveAllAnalyticsCapabilities } from "../registry/analytics-capability-resolver.js";
import { resolveAnalyticsRegistrySnapshot } from "../registry/analytics-registry-resolver.js";
import {
  assertUniqueAnalyticsProviderIds,
  buildAnalyticsAdapterContract,
} from "../validation/analytics-contract-validator.js";
import { buildAnalyticsDomainContractBundle } from "./analytics-domain-contract-service.js";

const lifecycleState = new Map<string, AnalyticsMetricLifecyclePhase>();

function nowIso(): string {
  return new Date().toISOString();
}

export function discoverAnalyticsProviders(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): AnalyticsDiscoveryResult {
  const snapshot = resolveAnalyticsRegistrySnapshot(context, query);
  const providers = snapshot.providers.map((row) =>
    buildAnalyticsAdapterContract(row, "unknown", "validated"),
  );
  assertUniqueAnalyticsProviderIds(providers);

  for (const provider of providers) {
    if (!lifecycleState.has(provider.analyticsId)) {
      lifecycleState.set(provider.analyticsId, "capture");
    }
  }

  return {
    discoveredCount: providers.length,
    providers,
    generatedAt: nowIso(),
    discoverySource: "AnalyticsProviderCatalog:dynamic",
  };
}

export function validateAnalyticsIntegration(
  context: RegistryLoaderContext,
  analyticsId: string,
): { valid: boolean; contract?: AnalyticsAdapterContract; reason: string } {
  const snapshot = resolveAnalyticsRegistrySnapshot(context, { registryRowId: analyticsId });
  const row = snapshot.providers[0];
  if (!row) {
    return {
      valid: false,
      reason: `Analytics provider not found: ${analyticsId}`,
    };
  }

  try {
    const contract = buildAnalyticsAdapterContract(row);
    buildAnalyticsDomainContractBundle(context, row);
    lifecycleState.set(analyticsId, "validate");
    return { valid: true, contract, reason: "Analytics integration contract validated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { valid: false, reason };
  }
}

export function getAnalyticsHealthSnapshot(
  context: RegistryLoaderContext,
  analyticsId: string,
): AnalyticsHealthSnapshot {
  const capabilities = resolveAllAnalyticsCapabilities(context).find(
    (entry) => entry.analyticsId === analyticsId,
  );
  const phase = lifecycleState.get(analyticsId) ?? "capture";

  return {
    analyticsId,
    healthStatus: capabilities?.policyCompliant ? "healthy" : "degraded",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    registryWired: Boolean(capabilities),
    policyCompliant: capabilities?.policyCompliant ?? false,
  };
}

export function advanceAnalyticsLifecycle(input: {
  actorId: string;
  workspaceId: string;
  analyticsId: string;
  targetPhase: AnalyticsMetricLifecyclePhase;
  pillowGovernance: true;
}): ReturnType<typeof transitionAnalyticsLifecycle> {
  const governance = validateAnalyticsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    analyticsId: input.analyticsId,
    operation: input.targetPhase === "archive" ? "archive" : input.targetPhase,
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const currentPhase = lifecycleState.get(input.analyticsId) ?? "capture";
    return {
      analyticsId: input.analyticsId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const currentPhase = lifecycleState.get(input.analyticsId) ?? "capture";
  const result = transitionAnalyticsLifecycle(currentPhase, {
    analyticsId: input.analyticsId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    lifecycleState.set(input.analyticsId, result.currentPhase);
  }

  return result;
}

export function resetAnalyticsIntegrationStateForTests(): void {
  lifecycleState.clear();
}
