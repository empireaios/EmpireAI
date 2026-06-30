import type { ProviderOperationalCapability, ProviderCapabilityVerification } from "../models/live-commerce-foundation.js";
import {
  LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS,
  mapToLiveCommerceLifecycle,
  PROVIDER_OPERATIONAL_CAPABILITIES,
} from "../models/live-commerce-foundation.js";
import { getRealityProvider } from "../models/provider-catalog.js";
import { getProviderCapabilityMatrixEntry } from "./provider-capability-matrix-service.js";
import { getConnectorRuntimeState } from "./connector-runtime.js";
import { mapLifecycleToHealthState } from "../models/connection-lifecycle.js";

const CAPABILITY_MAP: Record<ProviderOperationalCapability, string[]> = {
  publish: ["catalog_sync", "listing_readiness", "listing_publish"],
  inventory: ["catalog_sync", "inventory", "catalog"],
  orders: ["checkout", "orders", "fulfillment"],
  pricing: ["pricing", "catalog_sync"],
  returns: ["returns", "fulfillment"],
  messaging: ["messaging", "buyer_messaging"],
  analytics: ["available_metrics", "health", "account_validation"],
  advertising: ["campaign_validation", "audience", "budget"],
  settlement: ["fees", "currency", "settlement"],
  webhooks: ["webhook_registration", "webhooks"],
};

function capabilityHealth(
  supported: boolean,
  verified: boolean,
  lifecycleHealthy: boolean,
): "HEALTHY" | "WARNING" | "FAILED" | "DISABLED" {
  if (!supported) return "DISABLED";
  if (!lifecycleHealthy) return "WARNING";
  if (!verified) return "WARNING";
  return "HEALTHY";
}

/** REAL-002A — Provider capability verification (shared by all marketplaces). */
export function verifyProviderCapabilities(
  workspaceId: string,
  providerId: string,
): ProviderCapabilityVerification {
  const definition = getRealityProvider(providerId);
  const matrix = getProviderCapabilityMatrixEntry(providerId);
  const runtime = getConnectorRuntimeState(workspaceId, providerId);
  const lifecycle = mapToLiveCommerceLifecycle(runtime?.lifecycle);
  const lifecycleHealthy = ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(lifecycle);
  const providerCaps = new Set(definition?.capabilities ?? []);
  const requiredPerms = matrix?.requiredPermissions ?? [];

  const capabilities = PROVIDER_OPERATIONAL_CAPABILITIES.map((capability) => {
    const aliases = CAPABILITY_MAP[capability];
    const supported = aliases.some((a) => providerCaps.has(a)) || capability === "webhooks";
    const missingPermissions = supported
      ? requiredPerms.filter((p) => !runtime?.capabilities.includes(p) && providerCaps.size > 0)
      : [`${capability} not supported by provider definition`];
    const verified = supported && lifecycleHealthy && missingPermissions.length === 0;
    return {
      capability,
      supported,
      verified,
      missingPermissions,
      health: capabilityHealth(supported, verified, lifecycleHealthy),
    };
  });

  const missingPermissions = [
    ...new Set(capabilities.flatMap((c) => c.missingPermissions)),
  ];

  return {
    providerId,
    displayName: definition?.displayName ?? providerId,
    verificationState: lifecycle,
    capabilities,
    missingPermissions,
    health: mapLifecycleToHealthState(runtime?.lifecycle ?? "DISCOVERED"),
    computedAt: new Date().toISOString(),
  };
}

export function verifyLiveCommerceMarketplaceCapabilities(workspaceId: string): ProviderCapabilityVerification[] {
  return LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.map((id) => verifyProviderCapabilities(workspaceId, id));
}
