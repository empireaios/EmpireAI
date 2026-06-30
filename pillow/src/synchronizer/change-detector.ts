import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryMemoryState } from "../memory/types.js";
import type { RepositoryInspection } from "../recovery/types.js";
import { allSyncPaths, findSyncTargetByPath } from "./scope.js";
import type { DetectedChange, SyncChangeKind, SyncRequest } from "./types.js";

const GOVERNANCE_PATHS = new Set(allSyncPaths());

export function detectChanges(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryState,
  inspection: RepositoryInspection,
  request: SyncRequest = {},
): DetectedChange[] {
  const changes: DetectedChange[] = [];

  for (const signal of request.driftSignals ?? memory.consistency.driftSignals) {
    changes.push({
      kind: "drift_signal",
      summary: `Repository drift: ${signal}`,
      evidence: [`memory.consistency.driftSignals`, signal],
      affectedArtifacts: ["journey", "empire_status", "journey_audit"],
    });
  }

  for (const file of [...inspection.modifiedFiles, ...inspection.createdFiles]) {
    const target = findSyncTargetByPath(file);
    if (target || GOVERNANCE_PATHS.has(file) || file.startsWith("pillow/")) {
      changes.push({
        kind: target ? "governance_change" : "git_modification",
        summary: `Repository file changed: ${file}`,
        evidence: [`git diff`, file, inspection.diffSummary],
        affectedArtifacts: target ? [target.kind] : ["other"],
      });
    }
  }

  if (request.missionId?.startsWith("PILLOW-")) {
    changes.push({
      kind: "completed_pillow_mission",
      summary: `Completed Pillow mission: ${request.missionId}`,
      evidence: [
        request.missionId,
        request.missionTitle ?? bootstrap.currentMission ?? "unknown",
      ],
      affectedArtifacts: [
        "journey",
        "journey_audit",
        "empire_status",
        "empire_soul",
        "pillow_enhancement_register",
      ],
    });
  }

  if (request.missionId?.startsWith("UX-")) {
    changes.push({
      kind: "completed_ux_mission",
      summary: `Completed UX mission: ${request.missionId}`,
      evidence: [request.missionId],
      affectedArtifacts: ["journey", "journey_audit", "ux_enhancement_register"],
    });
  }

  if (request.auditApproved) {
    changes.push({
      kind: "approved_executive_audit",
      summary: "Executive Audit approved — synchronization report required",
      evidence: [
        request.missionId ?? "mission",
        "EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md",
      ],
      affectedArtifacts: ["journey_audit", "empire_status"],
    });
  }

  if (request.trigger) {
    const existing = changes.some((c) => c.kind === request.trigger);
    if (!existing) {
      changes.push({
        kind: request.trigger,
        summary: `Synchronization trigger: ${request.trigger}`,
        evidence: [request.trigger],
        affectedArtifacts: ["journey_audit"],
      });
    }
  }

  if (changes.length === 0 && !memory.consistency.synchronized) {
    changes.push({
      kind: "drift_signal",
      summary: "Memory consistency report indicates synchronization review",
      evidence: memory.consistency.issues,
      affectedArtifacts: ["journey", "empire_status"],
    });
  }

  return dedupeChanges(changes);
}

function dedupeChanges(changes: DetectedChange[]): DetectedChange[] {
  const seen = new Set<string>();
  return changes.filter((c) => {
    const key = `${c.kind}:${c.summary.slice(0, 60)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
