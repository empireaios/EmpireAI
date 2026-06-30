import type { RuntimeActivationAssessment } from "../models/live-commerce-foundation.js";
import {
  LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS,
  mapToLiveCommerceLifecycle,
} from "../models/live-commerce-foundation.js";
import { assessApprovalRequired } from "./approval-framework-service.js";
import { getConnectorRuntimeState } from "./connector-runtime.js";
import { verifyProviderCapabilities } from "./provider-capability-verification-service.js";
import { getRuntimePluginRegistry } from "../../../runtime/plugins/registry/runtime-plugin-registry.js";

const PLUGIN_BY_PROVIDER: Record<string, string> = {
  "amazon-seller": "amazon-seller",
  shopify: "shopify",
};

function isPluginEnabled(pluginId: string): boolean {
  const registry = getRuntimePluginRegistry();
  const entry = registry.listPlugins().find((m) => m.pluginId === pluginId);
  if (!entry) return false;
  return registry.lookupByCapability("publish_product").some((p) => p.pluginId === pluginId && p.enabled)
    || registry.getPlugin(pluginId) !== null;
}

/** REAL-002A — Runtime activation gate: CONNECTED + VERIFIED + founder approved. No bypasses. */
export function assessRuntimeActivation(
  workspaceId: string,
  providerId: string,
  actor = "system",
): RuntimeActivationAssessment {
  const runtime = getConnectorRuntimeState(workspaceId, providerId);
  const lifecycle = mapToLiveCommerceLifecycle(runtime?.lifecycle);
  const blockers: string[] = [];

  if (!runtime) blockers.push("Provider not connected");
  if (lifecycle === "NOT_CONNECTED" || lifecycle === "AUTHORIZATION_REQUIRED") {
    blockers.push("Connection lifecycle incomplete");
  }
  if (!["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(lifecycle)) {
    if (runtime) blockers.push(`Lifecycle must be CONNECTED or beyond (current: ${lifecycle})`);
  }
  if (runtime && lifecycle === "CONNECTED") {
    blockers.push("Provider must reach VERIFIED before runtime activation");
  }

  const capabilityReport = verifyProviderCapabilities(workspaceId, providerId);
  if (capabilityReport.missingPermissions.length > 0) {
    blockers.push("Missing required permissions");
  }

  const approval = assessApprovalRequired({
    workspaceId,
    providerId,
    action: "activate_runtime",
    actor,
  });
  const requiresFounderApproval = approval.requiresHumanApproval;
  const founderApproved = approval.approved;

  if (requiresFounderApproval && !founderApproved) {
    blockers.push("Founder approval required");
  }

  const pluginId = PLUGIN_BY_PROVIDER[providerId];
  const runtimePluginEligible = pluginId ? isPluginEnabled(pluginId) : false;
  if (pluginId && !runtimePluginEligible) {
    blockers.push(`Runtime plugin ${pluginId} not enabled`);
  }

  // Architecture protection: live execution remains blocked until all gates pass
  const activated =
    blockers.length === 0 &&
    ["VERIFIED", "READY", "ACTIVE"].includes(lifecycle) &&
    founderApproved;

  return {
    providerId,
    workspaceId,
    lifecycle,
    activated,
    blocked: !activated,
    blockers,
    requiresFounderApproval,
    founderApproved,
    runtimePluginEligible,
    computedAt: new Date().toISOString(),
  };
}

export function listRuntimeActivationAssessments(workspaceId: string): RuntimeActivationAssessment[] {
  return LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS.map((id) => assessRuntimeActivation(workspaceId, id));
}
