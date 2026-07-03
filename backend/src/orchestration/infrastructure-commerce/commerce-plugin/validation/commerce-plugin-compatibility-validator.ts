/**
 * G2-09 — Commerce plugin compatibility and isolation validation.
 */

import type {
  CommercePluginAdapterContract,
  CommercePluginCompatibilityResult,
} from "../contracts/commerce-plugin-integration-types.js";

export function validateCommercePluginCompatibility(
  contract: CommercePluginAdapterContract,
): CommercePluginCompatibilityResult {
  const isolationVerified = contract.compatibility.isolationRequired === true;
  const categoryMatch = contract.compatibility.supportedCategories.includes(contract.category);

  if (!isolationVerified) {
    return {
      pluginId: contract.pluginId,
      compatible: false,
      isolationVerified: false,
      reason: "Plugin isolation is required for commerce plugins",
    };
  }

  if (!categoryMatch) {
    return {
      pluginId: contract.pluginId,
      compatible: false,
      isolationVerified: true,
      reason: `Category ${contract.category} not in compatibility matrix`,
    };
  }

  return {
    pluginId: contract.pluginId,
    compatible: true,
    isolationVerified: true,
    reason: "Commerce plugin compatibility validated",
  };
}
