/**
 * G6-07 — Executive operations certification plugin host.
 */

import type { ExecutiveBlocker, ExecutiveOperationsPluginManifest } from "../contracts/executive-operations-types.js";
import { executiveOperationsPluginManifestSchema } from "../contracts/executive-operations-types.js";
import { validateExecutiveOperationsPillowGovernance } from "../governance/executive-operations-pillow-governance.js";

export type ExecutiveOperationsPluginHook = {
  pluginId: string;
  validatorKind: ExecutiveOperationsPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => ExecutiveBlocker[];
};

const pluginRecords = new Map<string, { manifest: ExecutiveOperationsPluginManifest; hooks: ExecutiveOperationsPluginHook }>();

export function registerExecutiveOperationsPlugin(input: {
  manifest: ExecutiveOperationsPluginManifest;
  hooks: ExecutiveOperationsPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateExecutiveOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "executive_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = executiveOperationsPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Executive operations plugin registered" };
}

export function runExecutiveOperationsPluginValidators(input: {
  workspaceId: string;
  validatorKind?: ExecutiveOperationsPluginManifest["validatorKind"];
}): ExecutiveBlocker[] {
  const findings: ExecutiveBlocker[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetExecutiveOperationsPluginHostForTests(): void {
  pluginRecords.clear();
}
