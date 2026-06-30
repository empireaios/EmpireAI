import type { SyncArtifactKind, SyncArtifactTarget } from "./types.js";

/** Canonical synchronization scope — expands as repository evolves. */
export const SYNC_ARTIFACT_CATALOG: SyncArtifactTarget[] = [
  {
    kind: "journey",
    relativePath: "JOURNEY.md",
    owner: "Journey",
    label: "Journey",
  },
  {
    kind: "journey_audit",
    relativePath: "JOURNEY_AUDIT.md",
    owner: "Journey Audit",
    label: "Journey Audit",
  },
  {
    kind: "empire_status",
    relativePath: "EMPIREAI_STATUS.md",
    owner: "Project Status",
    label: "Empire Status",
  },
  {
    kind: "empire_decisions",
    relativePath: "EMPIREAI_DECISIONS.md",
    owner: "Decision Register",
    label: "Empire Decisions",
  },
  {
    kind: "empire_soul",
    relativePath: "EMPIREAI_SOUL.md",
    owner: "Empire Soul",
    label: "Empire Soul",
  },
  {
    kind: "bl_a",
    relativePath: "BL-A.md",
    owner: "Backlog Release A",
    label: "BL-A",
  },
  {
    kind: "bl_b",
    relativePath: "BL-B.md",
    owner: "Backlog Release B",
    label: "BL-B",
  },
  {
    kind: "bl_c",
    relativePath: "BL-C.md",
    owner: "Backlog Release C",
    label: "BL-C",
  },
  {
    kind: "ux_enhancement_register",
    relativePath: "docs/governance/UX_ENHANCEMENT_REGISTER.md",
    owner: "UX Enhancement Register",
    label: "UX Enhancement Register",
  },
  {
    kind: "pillow_enhancement_register",
    relativePath: "docs/governance/PILLOW_ENHANCEMENT_REGISTER.md",
    owner: "Pillow Enhancement Register",
    label: "Pillow Enhancement Register",
  },
  {
    kind: "pillow_contract",
    relativePath: "PILLOW_ARCHITECTURE_CONTRACT.md",
    owner: "Pillow Architecture",
    label: "Pillow Contracts",
  },
  {
    kind: "doctrine",
    relativePath: "EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md",
    owner: "Repository Governance",
    label: "Repository Doctrines",
  },
  {
    kind: "architecture_decisions",
    relativePath: "EMPIREAI_DECISIONS.md",
    owner: "Decision Register",
    label: "Architecture Decision Records",
  },
];

export function findSyncTarget(kind: SyncArtifactKind): SyncArtifactTarget | undefined {
  return SYNC_ARTIFACT_CATALOG.find((t) => t.kind === kind);
}

export function findSyncTargetByPath(relativePath: string): SyncArtifactTarget | undefined {
  return SYNC_ARTIFACT_CATALOG.find((t) => t.relativePath === relativePath);
}

export function allSyncPaths(): string[] {
  return SYNC_ARTIFACT_CATALOG.map((t) => t.relativePath);
}
