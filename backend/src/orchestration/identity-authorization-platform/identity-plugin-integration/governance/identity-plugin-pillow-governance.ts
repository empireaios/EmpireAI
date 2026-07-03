/**
 * G8-09 — Pillow governance for identity plugin lifecycle.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";
import type { IdentityPluginManifest } from "../contracts/identity-plugin-types.js";

export type IdentityPluginGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
  workspaceBoundary: boolean;
  providerBoundary: boolean;
  credentialVisibility: boolean;
  pluginCompliance: boolean;
};

const semverPattern = /^\d+\.\d+\.\d+$/;

function deny(reason: string): IdentityPluginGovernanceResult {
  return {
    allowed: false,
    reason,
    eklsGoverned: false,
    workspaceBoundary: false,
    providerBoundary: false,
    credentialVisibility: false,
    pluginCompliance: false,
  };
}

export function validateIdentityPluginManifestStructure(
  manifest: IdentityPluginManifest,
): IdentityPluginGovernanceResult {
  if (!manifest.pluginId?.trim()) {
    return deny("pluginId is required");
  }
  if (!manifest.pluginName?.trim()) {
    return deny("pluginName is required");
  }
  if (!semverPattern.test(manifest.pluginVersion)) {
    return deny("pluginVersion must be semver (e.g. 1.0.0)");
  }
  if (!manifest.pluginOwner?.trim()) {
    return deny("pluginOwner is required");
  }
  if (!manifest.capabilities?.length) {
    return deny("capabilities are required");
  }
  if (!manifest.requiredPermissions?.length) {
    return deny("requiredPermissions are required for capability isolation");
  }
  if (manifest.governanceState !== "pillow-governed") {
    return deny("governanceState must be pillow-governed");
  }
  return {
    allowed: true,
    reason: "Plugin manifest structure valid",
    eklsGoverned: false,
    workspaceBoundary: true,
    providerBoundary: true,
    credentialVisibility: true,
    pluginCompliance: true,
  };
}

export function validateIdentityPluginTrust(
  manifest: IdentityPluginManifest,
  workspaceId: string,
): IdentityPluginGovernanceResult {
  const forbiddenPermissions = manifest.requiredPermissions.filter((permission) =>
    permission.toLowerCase().includes("secret"),
  );
  if (forbiddenPermissions.length > 0) {
    return deny("Plugin may not request secret-exposing permissions");
  }

  if (manifest.supportedProviders.length > 0) {
    const knownProviders = new Set(
      resolveAllConnectionProviders({ workspaceId }).map((provider) => provider.providerId),
    );
    const unknownProviders = manifest.supportedProviders.filter((providerId) => !knownProviders.has(providerId));
    if (unknownProviders.length > 0 && manifest.registryReferences.length === 0) {
      return deny(`Plugin provider boundary — unknown providers: ${unknownProviders.join(", ")}`);
    }
  }

  return {
    allowed: true,
    reason: "Plugin trust validation passed",
    eklsGoverned: false,
    workspaceBoundary: true,
    providerBoundary: true,
    credentialVisibility: true,
    pluginCompliance: true,
  };
}

export function validateIdentityPluginLifecycleGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  operation: "register" | "enable" | "disable" | "discover" | "validate" | "health";
  targetWorkspaceId?: string;
  providerId?: string;
}): IdentityPluginGovernanceResult {
  if (!input.pillowGovernance) {
    return deny("Pillow governance required — plugin lifecycle bypass forbidden");
  }
  if (!input.actorId?.trim() || !input.workspaceId?.trim() || !input.ownerId?.trim()) {
    return deny("actorId, workspaceId, and ownerId are required");
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    return deny("Cross-workspace plugin lifecycle blocked without explicit delegation");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "identity-plugin-integration",
      operation: input.operation === "discover" || input.operation === "validate" ? "search" : "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { ...deny(ekls.reason), eklsGoverned: false };
  }

  if (input.providerId) {
    const providerVisible = resolveAllConnectionProviders({ workspaceId: input.workspaceId }).some(
      (provider) => provider.providerId === input.providerId,
    );
    if (!providerVisible) {
      return deny(`Plugin provider boundary — ${input.providerId} not visible in workspace`);
    }
  }

  return {
    allowed: true,
    reason: "Pillow governance passed",
    eklsGoverned: true,
    workspaceBoundary: true,
    providerBoundary: true,
    credentialVisibility: true,
    pluginCompliance: true,
  };
}

export function validateIdentityPluginEligibility(input: {
  manifest: IdentityPluginManifest;
  workspaceId: string;
  pillowGovernance: true;
}): IdentityPluginGovernanceResult {
  const structure = validateIdentityPluginManifestStructure(input.manifest);
  if (!structure.allowed) return structure;
  return validateIdentityPluginTrust(input.manifest, input.workspaceId);
}
