/**
 * Version 1 logical snapshot metadata (certification records — no repository duplication).
 */

import { randomUUID } from "node:crypto";

import { buildVersion1Lockdown } from "../../../runtime/version-1-lockdown/index.js";
import { PROGRAM_CATALOG } from "../../master-completion-ledger/models/program-catalog.js";
import { EMPIRE_V1_PRODUCTION_DOMAIN } from "../../empire-activation/index.js";
import {
  EMPIREAI_VERSION_1_0,
  type VersionSnapshotKind,
  type VersionSnapshotRecord,
} from "../contracts/version-governance-types.js";
import type { EmpireVersion1Certification } from "../contracts/version-governance-types.js";

const CANONICAL_WORKSPACE_ID = "ws_empire_1";
const CANONICAL_COMPANY_ID = "co-grand-king";

const SNAPSHOT_SUMMARIES: Record<VersionSnapshotKind, string> = {
  repository: "Certified repository baseline — G0 through G8, V1 Activation, V1 Lock modules",
  architecture: "Certified architecture baseline — Pillow, Brain, Registry, EKLS, Cockpit, Guardian ownership preserved",
  registry: "Registry configuration snapshot — canonical registry IDs and resolver policies locked at V1.0",
  brain: "Brain execution snapshot — tool registry, routing, and isolation policies at V1.0",
  pillow: "Pillow governance snapshot — operating shell, voice, session persistence, version awareness at V1.0",
  cockpit: "Cockpit presentation snapshot — Executive Home, Authorization Centre, SCR registry at V1.0",
  ekls: "EKLS institutional memory snapshot — governance gateway and consumer channels at V1.0",
  production_configuration: `Production configuration snapshot — domain ${EMPIRE_V1_PRODUCTION_DOMAIN}, private gateway, search engine protection`,
  certification: "Version 1.0 certification snapshot — LOCKED, production baseline established",
};

function snapshotHash(kind: VersionSnapshotKind, baselineHash: string): string {
  return `${kind}:${baselineHash}`;
}

export function buildVersion1SnapshotMetadata(
  certification: EmpireVersion1Certification,
): VersionSnapshotRecord[] {
  const lockdown = buildVersion1Lockdown(CANONICAL_WORKSPACE_ID, CANONICAL_COMPANY_ID);
  const baselineHash = certification.baselineHash;
  const recordedAt = certification.certifiedAt;
  const kinds = Object.keys(SNAPSHOT_SUMMARIES) as VersionSnapshotKind[];

  return kinds.map((kind) => ({
    snapshotId: randomUUID(),
    kind,
    version: EMPIREAI_VERSION_1_0,
    summary:
      kind === "repository"
        ? `${SNAPSHOT_SUMMARIES[kind]} — ${PROGRAM_CATALOG.length} programmes inventoried`
        : kind === "architecture"
          ? `${SNAPSHOT_SUMMARIES[kind]} — readiness ${lockdown.baseline.architectureSnapshot.readinessScore}`
          : SNAPSHOT_SUMMARIES[kind],
    baselineHash: snapshotHash(kind, baselineHash),
    recordedAt,
    logicalOnly: true as const,
  }));
}
