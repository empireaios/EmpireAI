/**
 * G6-09 — Production simulation plugin host.
 */

import type { ProductionSimulationPluginManifest, SimulationBlocker } from "../contracts/production-simulation-types.js";
import { productionSimulationPluginManifestSchema } from "../contracts/production-simulation-types.js";
import { validateProductionSimulationPillowGovernance } from "../governance/production-simulation-pillow-governance.js";

export type ProductionSimulationPluginHook = {
  pluginId: string;
  pluginKind: ProductionSimulationPluginManifest["pluginKind"];
  validate: (input: { workspaceId: string }) => SimulationBlocker[];
};

const pluginRecords = new Map<string, { manifest: ProductionSimulationPluginManifest; hooks: ProductionSimulationPluginHook }>();

export function registerProductionSimulationPlugin(input: {
  manifest: ProductionSimulationPluginManifest;
  hooks: ProductionSimulationPluginHook;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId?: string; reason: string } {
  const governance = validateProductionSimulationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_full",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason };
  }

  const manifest = productionSimulationPluginManifestSchema.parse(input.manifest);
  if (input.hooks.pluginId !== manifest.pluginId) {
    return { accepted: false, reason: "Plugin hook pluginId must match manifest pluginId" };
  }

  pluginRecords.set(manifest.pluginId, { manifest, hooks: input.hooks });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Production simulation plugin registered" };
}

export function runProductionSimulationPluginValidators(input: {
  workspaceId: string;
  pluginKind?: ProductionSimulationPluginManifest["pluginKind"];
}): SimulationBlocker[] {
  const findings: SimulationBlocker[] = [];
  for (const record of pluginRecords.values()) {
    if (input.pluginKind && record.manifest.pluginKind !== input.pluginKind) continue;
    findings.push(...record.hooks.validate({ workspaceId: input.workspaceId }));
  }
  return findings;
}

export function resetProductionSimulationPluginHostForTests(): void {
  pluginRecords.clear();
}
