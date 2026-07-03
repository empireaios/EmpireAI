/**
 * G6-04 — Operational readiness plugin host.
 */

import type {
  OperationalBlocker,
  OperationalReadinessPluginManifest,
} from "../contracts/operational-readiness-types.js";
import { operationalReadinessPluginManifestSchema } from "../contracts/operational-readiness-types.js";
import { validateOperationalReadinessPillowGovernance } from "../governance/operational-readiness-pillow-governance.js";

export type OperationalReadinessPluginHook = {
  pluginId: string;
  validatorKind: OperationalReadinessPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => OperationalBlocker[];
};

const pluginRecords = new Map<string, { manifest: OperationalReadinessPluginManifest; hooks: OperationalReadinessPluginHook }>();

export function registerOperationalReadinessPlugin(input: {
  manifest: OperationalReadinessPluginManifest;
  hooks: OperationalReadinessPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateOperationalReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "operational_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = operationalReadinessPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Operational readiness plugin registered" };
}

export function runOperationalReadinessPluginValidators(input: {
  workspaceId: string;
  validatorKind?: OperationalReadinessPluginManifest["validatorKind"];
}): OperationalBlocker[] {
  const findings: OperationalBlocker[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetOperationalReadinessPluginHostForTests(): void {
  pluginRecords.clear();
}
