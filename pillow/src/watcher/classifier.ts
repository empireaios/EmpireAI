import { randomUUID } from "node:crypto";
import type { RepositoryInspection } from "../recovery/types.js";
import {
  BL_PATHS,
  DOCTRINE_PATH_PATTERN,
  EXECUTIVE_AUDIT_DIR,
  JOURNEY_PATHS,
} from "./observation-scope.js";
import type { ChangeClassification, ChangeKind } from "./types.js";

export function classifyPath(path: string): ChangeClassification {
  if (JOURNEY_PATHS.has(path)) return "journey";
  if (BL_PATHS.has(path)) return "governance";
  if (path.includes("REAL-") || path.includes("PROOF") || path.includes("MS-")) {
    return "commercial";
  }
  if (DOCTRINE_PATH_PATTERN.test(path)) return "architecture";
  if (path.includes("EXECUTIVE_AUDIT") || path.startsWith(EXECUTIVE_AUDIT_DIR)) {
    return "governance";
  }
  if (path.startsWith("pillow/")) return "engineering";
  if (path.includes("UX_") || path.includes("ux")) return "documentation";
  if (path.includes("sync") || path.includes("JOURNEY_AUDIT")) return "synchronization";
  if (path.includes("recovery") || path.includes("RECOVERY")) return "recovery";
  if (path.includes("config") || path.endsWith(".json")) return "configuration";
  return "repository";
}

export function inferChangeKind(
  path: string,
  snapshotKind: "new_file" | "modified_file" | "deleted_file",
  gitModified: boolean,
  gitCreated: boolean,
): ChangeKind {
  if (JOURNEY_PATHS.has(path)) return "journey_update";
  if (BL_PATHS.has(path)) return "bl_update";
  if (path.startsWith(EXECUTIVE_AUDIT_DIR)) return "executive_audit_added";
  if (DOCTRINE_PATH_PATTERN.test(path)) return "doctrine_addition";
  if (path.includes("PILLOW_ARCHITECTURE") || path.includes("DECISIONS")) {
    return "architecture_modification";
  }
  if (/PILLOW-\d+|UX-\d+/.test(path)) return "mission_completion";
  if (gitCreated || snapshotKind === "new_file") return "new_file";
  if (snapshotKind === "deleted_file") return "deleted_file";
  if (gitModified || snapshotKind === "modified_file") return "modified_file";
  return "contract_change";
}

export function buildChangeSummary(
  path: string,
  kind: ChangeKind,
): string {
  return `${kind.replace(/_/g, " ")}: ${path}`;
}

export function mergeGitInspection(
  inspection: RepositoryInspection,
  snapshotChanges: Array<{ path: string; kind: "new_file" | "modified_file" | "deleted_file" }>,
): Array<{ path: string; kind: ChangeKind; classification: ChangeClassification }> {
  const byPath = new Map<
    string,
    { path: string; kind: ChangeKind; classification: ChangeClassification }
  >();

  const gitModified = new Set(inspection.modifiedFiles);
  const gitCreated = new Set(inspection.createdFiles);

  for (const sc of snapshotChanges) {
    const kind = inferChangeKind(
      sc.path,
      sc.kind,
      gitModified.has(sc.path),
      gitCreated.has(sc.path),
    );
    byPath.set(sc.path, {
      path: sc.path,
      kind,
      classification: classifyPath(sc.path),
    });
  }

  for (const file of inspection.modifiedFiles) {
    if (!byPath.has(file)) {
      byPath.set(file, {
        path: file,
        kind: inferChangeKind(file, "modified_file", true, false),
        classification: classifyPath(file),
      });
    }
  }

  for (const file of inspection.createdFiles) {
    if (!byPath.has(file)) {
      byPath.set(file, {
        path: file,
        kind: "new_file",
        classification: classifyPath(file),
      });
    }
  }

  return [...byPath.values()];
}

export function toDetectedChanges(
  merged: Array<{ path: string; kind: ChangeKind; classification: ChangeClassification }>,
): import("./types.js").DetectedRepositoryChange[] {
  const now = new Date().toISOString();
  return merged.map((m) => ({
    changeId: randomUUID(),
    path: m.path,
    kind: m.kind,
    classification: m.classification,
    summary: buildChangeSummary(m.path, m.kind),
    detectedAt: now,
  }));
}
