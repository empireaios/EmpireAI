/**
 * G2-09 — Brain commerce plugin capability discovery (validated capabilities only).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  COMMERCE_PLUGIN_CATEGORIES,
  type CommercePluginBrainCapabilityDescriptor,
  type CommercePluginCategory,
} from "../contracts/commerce-plugin-integration-types.js";
import { listCommercePluginRecords } from "../state/commerce-plugin-state-manager.js";
import { discoverCommercePluginSlots } from "./commerce-plugin-integration-service.js";
import { resolveAllCommercePluginCapabilities } from "../registry/commerce-plugin-capability-resolver.js";

export function discoverCommercePluginCapabilitiesForBrain(
  context: RegistryLoaderContext,
): CommercePluginBrainCapabilityDescriptor[] {
  const registered = listCommercePluginRecords().filter(
    (record) =>
      record.frameworkRegistered &&
      (record.lifecyclePhase === "enable" ||
        record.lifecyclePhase === "execute" ||
        record.lifecyclePhase === "monitor"),
  );

  if (registered.length === 0) {
    return [];
  }

  const capabilityMap = new Map(
    resolveAllCommercePluginCapabilities(context, "enable").map((entry) => [entry.pluginId, entry]),
  );

  return registered
    .map((record) => {
      const resolved = capabilityMap.get(record.pluginId);
      if (!resolved?.policyCompliant) return undefined;

      return {
        pluginId: record.pluginId,
        category: record.category,
        capabilities: record.supportedCapabilities,
        validated: true as const,
        discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration" as const,
        brainRouted: true as const,
      };
    })
    .filter((entry): entry is CommercePluginBrainCapabilityDescriptor => Boolean(entry));
}

export function listCommercePluginBrainCategories(): readonly CommercePluginCategory[] {
  return COMMERCE_PLUGIN_CATEGORIES;
}

export function dispatchValidatedCommercePluginCapability(input: {
  pluginId: string;
  capabilityId: string;
  brainRouted: true;
}): { dispatched: boolean; reason: string } {
  if (!input.brainRouted) {
    return { dispatched: false, reason: "Brain routing required for commerce plugin dispatch" };
  }

  const record = listCommercePluginRecords().find((entry) => entry.pluginId === input.pluginId);
  if (!record || !record.frameworkRegistered) {
    return { dispatched: false, reason: `Plugin not registered: ${input.pluginId}` };
  }

  if (!record.supportedCapabilities.includes(input.capabilityId)) {
    return {
      dispatched: false,
      reason: `Capability ${input.capabilityId} not supported by plugin ${input.pluginId}`,
    };
  }

  if (record.lifecyclePhase !== "enable" && record.lifecyclePhase !== "execute" && record.lifecyclePhase !== "monitor") {
    return {
      dispatched: false,
      reason: `Plugin ${input.pluginId} is not enabled for execution (phase: ${record.lifecyclePhase})`,
    };
  }

  return {
    dispatched: true,
    reason: "Validated commerce plugin capability dispatched through Brain",
  };
}
