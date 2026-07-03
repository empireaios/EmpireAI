/**
 * G6-06 — Performance certification plugin host.
 */

import type { PerformanceBottleneck, PerformancePluginManifest } from "../contracts/performance-certification-types.js";
import { performancePluginManifestSchema } from "../contracts/performance-certification-types.js";
import { validatePerformancePillowGovernance } from "../governance/performance-pillow-governance.js";

export type PerformancePluginHook = {
  pluginId: string;
  validatorKind: PerformancePluginManifest["validatorKind"];
  validate: (input: { workspaceId: string }) => PerformanceBottleneck[];
};

const pluginRecords = new Map<string, { manifest: PerformancePluginManifest; hooks: PerformancePluginHook }>();

export function registerPerformancePlugin(input: {
  manifest: PerformancePluginManifest;
  hooks: PerformancePluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validatePerformancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "performance_scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = performancePluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Performance plugin registered" };
}

export function runPerformancePluginValidators(input: {
  workspaceId: string;
  validatorKind?: PerformancePluginManifest["validatorKind"];
}): PerformanceBottleneck[] {
  const findings: PerformanceBottleneck[] = [];
  for (const record of pluginRecords.values()) {
    if (input.validatorKind && record.manifest.validatorKind !== input.validatorKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetPerformancePluginHostForTests(): void {
  pluginRecords.clear();
}
