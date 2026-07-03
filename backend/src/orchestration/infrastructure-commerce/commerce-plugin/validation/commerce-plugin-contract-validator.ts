/**
 * G2-09 — Commerce plugin contract validation.
 */

import {
  COMMERCE_PLUGIN_CATEGORY_TO_KIND,
  commercePluginAdapterContractSchema,
  commercePluginSlotConfigurationSchema,
  type CommercePluginAdapterContract,
  type CommercePluginRegistrationManifest,
  type CommercePluginSlotConfiguration,
  type CommercePluginSlotRow,
} from "../contracts/commerce-plugin-integration-types.js";

export class CommercePluginValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommercePluginValidationError";
  }
}

export function parseCommercePluginSlotConfiguration(
  slot: CommercePluginSlotRow,
): CommercePluginSlotConfiguration {
  try {
    return commercePluginSlotConfigurationSchema.parse(slot.configuration.pluginSlot);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommercePluginValidationError(`Invalid plugin slot configuration: ${detail}`);
  }
}

export function buildCommercePluginAdapterContract(
  manifest: CommercePluginRegistrationManifest,
  slot: CommercePluginSlotRow,
  healthStatus: CommercePluginAdapterContract["healthStatus"] = "unknown",
  status: CommercePluginAdapterContract["status"] = "registered",
): CommercePluginAdapterContract {
  const slotConfig = parseCommercePluginSlotConfiguration(slot);
  const expectedKind = COMMERCE_PLUGIN_CATEGORY_TO_KIND[manifest.category];
  if (slotConfig.pluginKind !== expectedKind) {
    throw new CommercePluginValidationError(
      `Plugin category ${manifest.category} does not match slot kind ${slotConfig.pluginKind}`,
    );
  }

  const contract = {
    pluginId: manifest.pluginId,
    pluginName: manifest.pluginName,
    pluginVersion: manifest.pluginVersion,
    pluginOwner: manifest.pluginOwner,
    status,
    category: manifest.category,
    pluginKind: slotConfig.pluginKind,
    supportedCapabilities: manifest.supportedCapabilities,
    supportedInterfaces: slotConfig.supportedInterfaces,
    dependencies: slot.dependencies,
    registryReferences: [slotConfig.registryRef],
    configuration: slotConfig.configuration,
    permissions: slotConfig.permissions,
    healthStatus,
    lifecycleHooks: slotConfig.lifecycleHooks,
    compatibility: slotConfig.compatibility,
    provenance: manifest.provenance,
    slotRef: slot.id,
    discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration" as const,
  };

  try {
    return commercePluginAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommercePluginValidationError(`Invalid commerce plugin contract: ${detail}`);
  }
}

export function validateCommercePluginRegistrationManifest(
  manifest: CommercePluginRegistrationManifest,
): { valid: boolean; reason: string } {
  if (!manifest.pillowGovernance) {
    return { valid: false, reason: "Commerce plugins require pillowGovernance: true" };
  }
  if (!manifest.brainRouted) {
    return { valid: false, reason: "Commerce plugins must be Brain-routed" };
  }
  if (!manifest.pluginId?.trim() || !manifest.pluginName?.trim()) {
    return { valid: false, reason: "pluginId and pluginName are required" };
  }
  if (manifest.supportedCapabilities.length === 0) {
    return { valid: false, reason: "supportedCapabilities must not be empty" };
  }
  return { valid: true, reason: "Commerce plugin registration manifest validated" };
}
