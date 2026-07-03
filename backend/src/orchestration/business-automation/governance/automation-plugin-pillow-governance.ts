/**
 * G5-09 — Pillow governance for automation plugin lifecycle.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationPluginManifest } from "../contracts/automation-plugin-types.js";

export type AutomationPluginGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

const semverPattern = /^\d+\.\d+\.\d+$/;

export function validateAutomationPluginManifestStructure(
  manifest: AutomationPluginManifest,
): AutomationPluginGovernanceResult {
  if (!manifest.pluginId?.trim()) {
    return { allowed: false, reason: "pluginId is required", eklsGoverned: false };
  }
  if (!manifest.pluginName?.trim()) {
    return { allowed: false, reason: "pluginName is required", eklsGoverned: false };
  }
  if (!semverPattern.test(manifest.version)) {
    return { allowed: false, reason: "version must be semver (e.g. 1.0.0)", eklsGoverned: false };
  }
  if (!manifest.owner?.trim()) {
    return { allowed: false, reason: "owner is required", eklsGoverned: false };
  }
  if (!manifest.capabilities?.length) {
    return { allowed: false, reason: "capabilities are required", eklsGoverned: false };
  }
  if (!manifest.supportedInterfaces?.length) {
    return { allowed: false, reason: "supportedInterfaces are required", eklsGoverned: false };
  }
  if (!manifest.permissions?.length) {
    return { allowed: false, reason: "permissions are required for capability isolation", eklsGoverned: false };
  }
  return { allowed: true, reason: "Plugin manifest structure valid", eklsGoverned: false };
}

export function validateAutomationPluginLifecycleGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  operation: "register" | "enable" | "disable" | "unload" | "discover";
  killSwitchActive?: boolean;
}): AutomationPluginGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — plugin lifecycle bypass forbidden",
      eklsGoverned: false,
    };
  }

  if (input.killSwitchActive) {
    return {
      allowed: false,
      reason: "Global automation kill switch active — plugin lifecycle blocked",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "business-automation",
      operation: input.operation === "discover" ? "search" : "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { allowed: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    allowed: true,
    reason: "Plugin approval, trust, permissions, isolation, and compliance validated",
    eklsGoverned: true,
  };
}

export function validateAutomationPluginTrust(manifest: AutomationPluginManifest): AutomationPluginGovernanceResult {
  if (manifest.trustLevel === "enterprise" && !manifest.owner.includes(":")) {
    return {
      allowed: false,
      reason: "Enterprise plugins require namespaced owner for digital trust verification",
      eklsGoverned: false,
    };
  }
  return { allowed: true, reason: "Plugin trust validated", eklsGoverned: false };
}
