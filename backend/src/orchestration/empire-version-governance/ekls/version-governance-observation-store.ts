/**
 * Version governance EKLS observation store (in-memory, metadata only).
 */

import type { VersionGovernanceEklsKind } from "../contracts/version-governance-types.js";

export type VersionGovernanceObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  kind: VersionGovernanceEklsKind;
  version: string;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const OBSERVATIONS: VersionGovernanceObservation[] = [];

export function appendVersionGovernanceObservation(
  observation: VersionGovernanceObservation,
): void {
  OBSERVATIONS.push(observation);
}

export function searchVersionGovernanceObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: VersionGovernanceEklsKind;
  version?: string;
}): VersionGovernanceObservation[] {
  return OBSERVATIONS.filter((o) => {
    if (input.actorId && o.actorId !== input.actorId) return false;
    if (input.workspaceId && o.workspaceId !== input.workspaceId) return false;
    if (input.kind && o.kind !== input.kind) return false;
    if (input.version && o.version !== input.version) return false;
    return true;
  });
}

export function resetVersionGovernanceObservationsForTests(): void {
  OBSERVATIONS.length = 0;
}

export function seedVersion1EklsObservations(input: {
  actorId: string;
  workspaceId: string;
  version: string;
  releaseDate: string;
}): void {
  const kinds: Array<{ kind: VersionGovernanceEklsKind; summary: string }> = [
    {
      kind: "version_certification",
      summary: `${input.version} certification — LOCKED, production baseline established`,
    },
    {
      kind: "version_lock",
      summary: `${input.version} lock authorized by Grand King — immutable baseline`,
    },
    {
      kind: "version_history",
      summary: `Version history entry #1 — ${input.version} release ${input.releaseDate}`,
    },
    {
      kind: "version_executive_audit",
      summary: `${input.version} executive audit — PASS WITH CONDITIONS`,
    },
    {
      kind: "version_release",
      summary: `${input.version} release — Empire Activation complete, production eligible`,
    },
  ];

  for (const entry of kinds) {
    appendVersionGovernanceObservation({
      observationId: `seed-${entry.kind}`,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      kind: entry.kind,
      version: input.version,
      summary: entry.summary,
      recordedAt: new Date().toISOString(),
      pillowGoverned: true,
    });
  }
}
