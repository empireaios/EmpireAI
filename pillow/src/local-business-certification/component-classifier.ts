import type { ComponentStatus, MissionEvidence, Q7Mission, WorkerProbeResult } from "./types.js";

export type ClassificationResult = { status: ComponentStatus; reason: string };

/**
 * Maps observed evidence + a runtime probe to one of the five component
 * statuses. Every branch is evidence-gated; nothing here upgrades a status
 * without an observed fact backing it, and nothing downgrades a status
 * without an observed contradiction or thrown probe.
 */
export function classifyComponent(
  evidence: MissionEvidence,
  probe: WorkerProbeResult,
  deferred: boolean = evidence.deferred,
): ClassificationResult {
  if (deferred) {
    return {
      status: "Intentionally Deferred",
      reason: evidence.deferred
        ? "Repository evidence explicitly marks this mission as deferred"
        : "Input explicitly marked this mission as deferred",
    };
  }
  if (!evidence.moduleExists) {
    return { status: "Missing", reason: `Module directory not found at repository root` };
  }
  if (evidence.evidenceContradiction) {
    return { status: "Broken / Deviating", reason: evidence.evidenceContradiction };
  }
  if (probe.error) {
    return { status: "Broken / Deviating", reason: `Runtime probe threw: ${probe.error}` };
  }

  const complete =
    evidence.finalPass &&
    evidence.sessionReferenced &&
    evidence.registryReferenced &&
    probe.reachable;
  if (complete) {
    return {
      status: "Completed",
      reason:
        "Module present, prior FINAL PASS evidence observed, session and subsystem registry references observed, and runtime probe reachable",
    };
  }

  const gaps: string[] = [];
  if (!evidence.finalPass) gaps.push("no prior FINAL PASS evidence observed");
  if (!evidence.sessionReferenced) gaps.push("no session.ts reference observed");
  if (!evidence.registryReferenced) gaps.push("no subsystem registry reference observed");
  if (!probe.reachable) gaps.push(`runtime not reachable (${probe.evidence})`);
  return { status: "Partially Implemented", reason: gaps.join("; ") };
}

export function classifyMissionDeferred(
  mission: Q7Mission,
  deferredMissionIds: readonly string[] | undefined,
): boolean {
  return Boolean(deferredMissionIds?.includes(mission.missionId));
}
