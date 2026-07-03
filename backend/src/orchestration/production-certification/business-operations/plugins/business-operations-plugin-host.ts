/**
 * G6-05 — Business operations plugin host.
 */

import type {
  BusinessFinding,
  BusinessOperationsPluginManifest,
} from "../contracts/business-operations-types.js";
import { businessOperationsPluginManifestSchema } from "../contracts/business-operations-types.js";
import { validateBusinessOperationsPillowGovernance } from "../governance/business-operations-pillow-governance.js";

export type BusinessOperationsPluginHook = {
  pluginId: string;
  validatorKind: BusinessOperationsPluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => BusinessFinding[];
};

const pluginRecords = new Map<string, { manifest: BusinessOperationsPluginManifest; hooks: BusinessOperationsPluginHook }>();

export function registerBusinessOperationsPlugin(input: {
  manifest: BusinessOperationsPluginManifest;
  hooks: BusinessOperationsPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateBusinessOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "business_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = businessOperationsPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Business operations plugin registered" };
}

export function runBusinessOperationsPluginValidators(input: {
  workspaceId: string;
  validatorKind?: BusinessOperationsPluginManifest["validatorKind"];
}): BusinessFinding[] {
  const findings: BusinessFinding[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetBusinessOperationsPluginHostForTests(): void {
  pluginRecords.clear();
}
