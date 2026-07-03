/**
 * G7-07 — Autonomous operations plugin host.
 */

import type { AutonomousOperationsPluginManifest } from "../contracts/autonomous-operations-types.js";
import { autonomousOperationsPluginManifestSchema } from "../contracts/autonomous-operations-types.js";

const plugins = new Map<string, { manifest: AutonomousOperationsPluginManifest }>();

export function registerAutonomousOperationsPlugin(input: {
  manifest: AutonomousOperationsPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = autonomousOperationsPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Autonomous operations plugin registered" };
}

export function resetAutonomousOperationsPluginHostForTests(): void {
  plugins.clear();
}

export function listAutonomousOperationsPlugins(): AutonomousOperationsPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
