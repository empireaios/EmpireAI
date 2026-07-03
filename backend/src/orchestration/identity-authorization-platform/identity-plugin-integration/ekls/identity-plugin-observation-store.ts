/**
 * G8-09 — Identity plugin EKLS observation store.
 */

import type { IdentityPluginEklsKind } from "../contracts/identity-plugin-types.js";

export type IdentityPluginObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  pluginId: string;
  kind: IdentityPluginEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: IdentityPluginObservation[] = [];

export function appendIdentityPluginObservation(observation: IdentityPluginObservation): void {
  observations.push(observation);
}

export function searchIdentityPluginObservations(input: {
  actorId?: string;
  workspaceId?: string;
  pluginId?: string;
  kind?: IdentityPluginEklsKind;
}): IdentityPluginObservation[] {
  return observations.filter((entry) => {
    if (input.actorId && entry.actorId !== input.actorId) return false;
    if (input.workspaceId && entry.workspaceId !== input.workspaceId) return false;
    if (input.pluginId && entry.pluginId !== input.pluginId) return false;
    if (input.kind && entry.kind !== input.kind) return false;
    return true;
  });
}

export function resetIdentityPluginObservationStoreForTests(): void {
  observations.length = 0;
}
