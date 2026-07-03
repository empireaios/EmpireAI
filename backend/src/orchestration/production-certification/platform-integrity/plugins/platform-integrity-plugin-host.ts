/**
 * G6-01 — Platform integrity plugin host (validators without modifying certification core).
 */

import type {
  PlatformIntegrityPluginManifest,
  PlatformIntegrityViolation,
} from "../contracts/platform-integrity-types.js";
import { platformIntegrityPluginManifestSchema } from "../contracts/platform-integrity-types.js";
import { validatePlatformIntegrityPillowGovernance } from "../governance/platform-integrity-pillow-governance.js";

export type PlatformIntegrityPluginHook = {
  pluginId: string;
  validatorKind: PlatformIntegrityPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => PlatformIntegrityViolation[];
};

export type PlatformIntegrityPluginRecord = {
  manifest: PlatformIntegrityPluginManifest;
  hooks: PlatformIntegrityPluginHook;
  lifecycleState: "registered" | "enabled" | "disabled";
  registeredAt: string;
};

const pluginRecords = new Map<string, PlatformIntegrityPluginRecord>();

export function registerPlatformIntegrityPlugin(input: {
  manifest: PlatformIntegrityPluginManifest;
  hooks: PlatformIntegrityPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validatePlatformIntegrityPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = platformIntegrityPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, {
    manifest,
    hooks: input.hooks,
    lifecycleState: "enabled",
    registeredAt: new Date().toISOString(),
  });

  return { accepted: true, pluginId: manifest.pluginId, reason: "Platform integrity plugin registered" };
}

export function runPlatformIntegrityPluginValidators(input: {
  workspaceId: string;
  validatorKind?: PlatformIntegrityPluginManifest["validatorKind"];
}): PlatformIntegrityViolation[] {
  const violations: PlatformIntegrityViolation[] = [];
  for (const record of pluginRecords.values()) {
    if (record.lifecycleState !== "enabled") continue;
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    violations.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return violations;
}

export function listPlatformIntegrityPlugins(): PlatformIntegrityPluginRecord[] {
  return [...pluginRecords.values()];
}

export function resetPlatformIntegrityPluginHostForTests(): void {
  pluginRecords.clear();
}
