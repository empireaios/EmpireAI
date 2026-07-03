/**
 * G2-09 — Commerce plugin integration service.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  CommercePluginAdapterContract,
  CommercePluginDiscoveryResult,
  CommercePluginHealthStatus,
  CommercePluginLifecyclePhase,
  CommercePluginRegistrationManifest,
} from "../contracts/commerce-plugin-integration-types.js";
import { listCommercePluginSlots } from "../data/commerce-plugin-slot-store.js";
import {
  registerCommercePluginThroughFramework,
  COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
} from "../framework/commerce-plugin-framework-bridge.js";
import { validateCommercePluginPillowGovernance } from "../governance/commerce-plugin-pillow-governance.js";
import { transitionCommercePluginLifecycle } from "../lifecycle/commerce-plugin-lifecycle.js";
import {
  resolveCommercePluginRegistrySnapshot,
  verifyPluginSlotRegistryRef,
} from "../registry/commerce-plugin-registry-resolver.js";
import {
  getCommercePluginLifecyclePhase,
  getCommercePluginRecordById,
  listCommercePluginRecords,
  saveCommercePluginRecord,
  updateCommercePluginLifecyclePhase,
  resetCommercePluginStateForTests,
} from "../state/commerce-plugin-state-manager.js";
import {
  buildCommercePluginAdapterContract,
  validateCommercePluginRegistrationManifest,
} from "../validation/commerce-plugin-contract-validator.js";
import { validateCommercePluginCompatibility } from "../validation/commerce-plugin-compatibility-validator.js";

export {
  getCommercePluginRecordById,
  listCommercePluginRecords,
} from "../state/commerce-plugin-state-manager.js";

function nowIso(): string {
  return new Date().toISOString();
}

export type CommercePluginHealthSnapshot = {
  pluginId: string;
  healthStatus: CommercePluginHealthStatus;
  lifecyclePhase: CommercePluginLifecyclePhase;
  monitoredAt: string;
  frameworkRegistered: boolean;
  isolationVerified: boolean;
  policyCompliant: boolean;
};

export function discoverCommercePluginSlots(
  context: RegistryLoaderContext = {},
): CommercePluginDiscoveryResult {
  void context;
  const slots = listCommercePluginSlots();
  const plugins: CommercePluginAdapterContract[] = slots.map((slot) => {
    const slotConfig = slot.configuration.pluginSlot as {
      category: CommercePluginAdapterContract["category"];
      pluginKind: CommercePluginAdapterContract["pluginKind"];
      supportedCapabilities: string[];
      supportedInterfaces: string[];
      registryRef: CommercePluginAdapterContract["registryReferences"][number];
      permissions: CommercePluginAdapterContract["permissions"];
      lifecycleHooks: CommercePluginAdapterContract["lifecycleHooks"];
      compatibility: CommercePluginAdapterContract["compatibility"];
      configuration: Record<string, unknown>;
    };

    return {
      pluginId: slot.id,
      pluginName: slot.name,
      pluginVersion: slot.version,
      pluginOwner: slot.owner,
      status: "draft" as const,
      category: slotConfig.category,
      pluginKind: slotConfig.pluginKind,
      supportedCapabilities: slotConfig.supportedCapabilities,
      supportedInterfaces: slotConfig.supportedInterfaces,
      dependencies: slot.dependencies,
      registryReferences: [slotConfig.registryRef],
      configuration: slotConfig.configuration,
      permissions: slotConfig.permissions,
      healthStatus: "unknown" as const,
      lifecycleHooks: slotConfig.lifecycleHooks,
      compatibility: slotConfig.compatibility,
      provenance: "official" as const,
      slotRef: slot.id,
      discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration" as const,
    };
  });

  return {
    discoveredCount: plugins.length,
    plugins,
    slots,
    generatedAt: nowIso(),
    discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration",
  };
}

export function validateCommercePluginSlot(
  context: RegistryLoaderContext,
  slotId: string,
): { valid: boolean; reason: string } {
  const slot = listCommercePluginSlots().find((entry) => entry.id === slotId);
  if (!slot) {
    return { valid: false, reason: `Commerce plugin slot not found: ${slotId}` };
  }

  const slotConfig = slot.configuration.pluginSlot as {
    registryRef: { registryId: string; registryRowId: string };
  };

  if (
    !verifyPluginSlotRegistryRef(
      context,
      slotConfig.registryRef.registryId,
      slotConfig.registryRef.registryRowId,
    )
  ) {
    return {
      valid: false,
      reason: `Registry ref verification failed for slot ${slotId}`,
    };
  }

  return { valid: true, reason: "Commerce plugin slot validated against registry" };
}

export function registerCommercePlugin(input: {
  context: RegistryLoaderContext;
  manifest: CommercePluginRegistrationManifest;
  actorId: string;
  workspaceId: string;
}): {
  accepted: boolean;
  pluginId: string;
  reason: string;
  frameworkSource: typeof COMMERCE_PLUGIN_FRAMEWORK_SOURCE;
} {
  const manifestValidation = validateCommercePluginRegistrationManifest(input.manifest);
  if (!manifestValidation.valid) {
    return {
      accepted: false,
      pluginId: input.manifest.pluginId,
      reason: manifestValidation.reason,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const governance = validateCommercePluginPillowGovernance({
    ...input.context,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    slotId: input.manifest.slotId,
    operation: "register",
    pillowGovernance: true,
    brainRouted: true,
  });

  if (!governance.allowed) {
    return {
      accepted: false,
      pluginId: input.manifest.pluginId,
      reason: governance.reason,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const slotValidation = validateCommercePluginSlot(input.context, input.manifest.slotId);
  if (!slotValidation.valid) {
    return {
      accepted: false,
      pluginId: input.manifest.pluginId,
      reason: slotValidation.reason,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const slot = listCommercePluginSlots().find((entry) => entry.id === input.manifest.slotId)!;
  const contract = buildCommercePluginAdapterContract(input.manifest, slot);
  const compatibility = validateCommercePluginCompatibility(contract);
  if (!compatibility.compatible) {
    return {
      accepted: false,
      pluginId: input.manifest.pluginId,
      reason: compatibility.reason,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const frameworkResult = registerCommercePluginThroughFramework(input.manifest);
  if (!frameworkResult.accepted) {
    return {
      accepted: false,
      pluginId: frameworkResult.pluginId,
      reason: frameworkResult.message,
      frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
    };
  }

  const record = {
    ...contract,
    lifecyclePhase: "register" as const,
    registeredAt: nowIso(),
    frameworkRegistered: true as const,
  };
  saveCommercePluginRecord(record);

  return {
    accepted: true,
    pluginId: input.manifest.pluginId,
    reason: "Commerce plugin registered exclusively through EmpireAI Plugin Framework",
    frameworkSource: COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
  };
}

export function getCommercePluginHealthSnapshot(
  context: RegistryLoaderContext,
  pluginId: string,
): CommercePluginHealthSnapshot {
  const record = getCommercePluginRecordById(pluginId);
  const phase = getCommercePluginLifecyclePhase(pluginId);
  const compatibility = record ? validateCommercePluginCompatibility(record) : undefined;

  void resolveCommercePluginRegistrySnapshot(context);

  return {
    pluginId,
    healthStatus: record?.healthStatus ?? "unknown",
    lifecyclePhase: phase,
    monitoredAt: nowIso(),
    frameworkRegistered: Boolean(record?.frameworkRegistered),
    isolationVerified: compatibility?.isolationVerified ?? false,
    policyCompliant: Boolean(record?.dependencies.includes("pol-foundation-commerce-default")),
  };
}

export function advanceCommercePluginLifecycle(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pluginId: string;
  targetPhase: CommercePluginLifecyclePhase;
  pillowGovernance: true;
  brainRouted: true;
}): ReturnType<typeof transitionCommercePluginLifecycle> {
  const governance = validateCommercePluginPillowGovernance({
    ...(input.context ?? {}),
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pluginId: input.pluginId,
    operation: input.targetPhase,
    pillowGovernance: true,
    brainRouted: true,
  });

  const currentPhase = getCommercePluginLifecyclePhase(input.pluginId);
  if (!governance.allowed) {
    return {
      pluginId: input.pluginId,
      previousPhase: currentPhase,
      currentPhase,
      allowed: false,
      reason: governance.reason,
    };
  }

  const result = transitionCommercePluginLifecycle(currentPhase, {
    pluginId: input.pluginId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pillowGovernance: true,
    brainRouted: true,
    targetPhase: input.targetPhase,
  });

  if (result.allowed) {
    updateCommercePluginLifecyclePhase(input.pluginId, result.currentPhase);
  }

  return result;
}

export function resetCommercePluginIntegrationStateForTests(): void {
  resetCommercePluginStateForTests();
}
