/**
 * G8-09 — Identity plugin compatibility validation.
 */

import type {
  IdentityPluginManifest,
  IdentityPluginValidationResult,
} from "../contracts/identity-plugin-types.js";
import { resolveIdentityPluginRegistryPolicy } from "../registry/identity-plugin-registry-policy-resolver.js";
import {
  validateIdentityPluginManifestStructure,
  validateIdentityPluginTrust,
} from "../governance/identity-plugin-pillow-governance.js";

export function validateIdentityPluginCompatibility(
  manifest: IdentityPluginManifest,
): { passed: boolean; reason: string; warnings: string[] } {
  const warnings: string[] = [];
  const matrix = manifest.compatibilityMatrix;
  const minFrameworkVersion = typeof matrix.minFrameworkVersion === "string" ? matrix.minFrameworkVersion : undefined;

  if (minFrameworkVersion && !/^\d+\.\d+\.\d+$/.test(minFrameworkVersion)) {
    return { passed: false, reason: "compatibilityMatrix.minFrameworkVersion must be semver", warnings };
  }

  if (manifest.supportedProviders.length === 0 && manifest.registryReferences.length === 0) {
    warnings.push("Plugin declares no supportedProviders or registryReferences — provider coverage may be empty");
  }

  return { passed: true, reason: "Compatibility matrix valid", warnings };
}

export function validateIdentityPlugin(input: {
  manifest: IdentityPluginManifest;
  workspaceId: string;
}): IdentityPluginValidationResult {
  const structure = validateIdentityPluginManifestStructure(input.manifest);
  if (!structure.allowed) {
    return {
      pluginId: input.manifest.pluginId,
      valid: false,
      lifecycleState: "discovered",
      compatibilityPassed: false,
      registryPolicyPassed: false,
      governancePassed: false,
      reason: structure.reason,
      warnings: [],
    };
  }

  const trust = validateIdentityPluginTrust(input.manifest, input.workspaceId);
  if (!trust.allowed) {
    return {
      pluginId: input.manifest.pluginId,
      valid: false,
      lifecycleState: "discovered",
      compatibilityPassed: false,
      registryPolicyPassed: false,
      governancePassed: false,
      reason: trust.reason,
      warnings: [],
    };
  }

  const compatibility = validateIdentityPluginCompatibility(input.manifest);
  if (!compatibility.passed) {
    return {
      pluginId: input.manifest.pluginId,
      valid: false,
      lifecycleState: "validated",
      compatibilityPassed: false,
      registryPolicyPassed: false,
      governancePassed: true,
      reason: compatibility.reason,
      warnings: compatibility.warnings,
    };
  }

  const policy = resolveIdentityPluginRegistryPolicy({
    pluginId: input.manifest.pluginId,
    category: input.manifest.pluginCategory,
    registryReferences: input.manifest.registryReferences,
    context: { workspaceId: input.workspaceId },
  });

  if (!policy.allowed) {
    return {
      pluginId: input.manifest.pluginId,
      valid: false,
      lifecycleState: "validated",
      compatibilityPassed: true,
      registryPolicyPassed: false,
      governancePassed: true,
      reason: policy.reason,
      warnings: compatibility.warnings,
    };
  }

  return {
    pluginId: input.manifest.pluginId,
    valid: true,
    lifecycleState: "validated",
    compatibilityPassed: true,
    registryPolicyPassed: true,
    governancePassed: true,
    reason: "Plugin validation passed",
    warnings: compatibility.warnings,
  };
}
