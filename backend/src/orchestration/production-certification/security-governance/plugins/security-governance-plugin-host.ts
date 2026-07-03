/**
 * G6-02 — Security governance plugin host.
 */

import type {
  SecurityGovernancePluginManifest,
  SecurityGovernanceViolation,
} from "../contracts/security-governance-types.js";
import { securityGovernancePluginManifestSchema } from "../contracts/security-governance-types.js";
import { validateSecurityGovernancePillowGovernance } from "../governance/security-governance-pillow-governance.js";

export type SecurityGovernancePluginHook = {
  pluginId: string;
  validatorKind: SecurityGovernancePluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => SecurityGovernanceViolation[];
};

export type SecurityGovernancePluginRecord = {
  manifest: SecurityGovernancePluginManifest;
  hooks: SecurityGovernancePluginHook;
  lifecycleState: "registered" | "enabled" | "disabled";
  registeredAt: string;
};

const pluginRecords = new Map<string, SecurityGovernancePluginRecord>();

export function registerSecurityGovernancePlugin(input: {
  manifest: SecurityGovernancePluginManifest;
  hooks: SecurityGovernancePluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateSecurityGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "security_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = securityGovernancePluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, {
    manifest,
    hooks: input.hooks,
    lifecycleState: "enabled",
    registeredAt: new Date().toISOString(),
  });

  return { accepted: true, pluginId: manifest.pluginId, reason: "Security governance plugin registered" };
}

export function runSecurityGovernancePluginValidators(input: {
  workspaceId: string;
  validatorKind?: SecurityGovernancePluginManifest["validatorKind"];
}): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];
  for (const record of pluginRecords.values()) {
    if (record.lifecycleState !== "enabled") continue;
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    violations.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return violations;
}

export function listSecurityGovernancePlugins(): SecurityGovernancePluginRecord[] {
  return [...pluginRecords.values()];
}

export function resetSecurityGovernancePluginHostForTests(): void {
  pluginRecords.clear();
}
