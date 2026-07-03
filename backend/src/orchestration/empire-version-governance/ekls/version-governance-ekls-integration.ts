/**
 * Version governance EKLS integration — permanent Version 1 memory.
 */

import { randomUUID } from "node:crypto";

import {
  VERSION_GOVERNANCE_EKLS_KINDS,
  type VersionGovernanceEklsKind,
} from "../contracts/version-governance-types.js";
import { validateVersionGovernancePillowGovernance } from "../governance/version-governance-pillow-governance.js";
import {
  appendVersionGovernanceObservation,
  searchVersionGovernanceObservations,
  seedVersion1EklsObservations,
} from "./version-governance-observation-store.js";

export function recordVersionGovernanceEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  kind: VersionGovernanceEklsKind;
  version: string;
  summary: string;
  pillowGovernance: true;
}) {
  const pillow = validateVersionGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "record_ekls",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  if (!(VERSION_GOVERNANCE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return {
      accepted: false,
      reason: `Unknown version governance EKLS kind: ${input.kind}`,
      eklsGoverned: true,
    };
  }

  const observationId = randomUUID();
  appendVersionGovernanceObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    kind: input.kind,
    version: input.version,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Version governance EKLS record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchVersionGovernanceEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: VersionGovernanceEklsKind;
  version?: string;
  pillowGovernance: true;
}) {
  return searchVersionGovernanceObservations(input);
}

export function listVersionGovernanceEklsKinds(): readonly VersionGovernanceEklsKind[] {
  return VERSION_GOVERNANCE_EKLS_KINDS;
}

export function recordEmpireVersion1EklsBaseline(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  version: string;
  releaseDate: string;
}) {
  seedVersion1EklsObservations(input);
  return {
    accepted: true,
    kindsRecorded: VERSION_GOVERNANCE_EKLS_KINDS.length,
    reason: "EmpireAI Version 1.0 permanently recorded in EKLS",
  };
}

export { resetVersionGovernanceObservationsForTests } from "./version-governance-observation-store.js";
