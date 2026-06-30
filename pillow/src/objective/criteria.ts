import type { EmpireBootstrapContext } from "../bootstrap/types.js";

import type { ObjectiveSuccessCriterion } from "./types.js";

export const DEFAULT_OBJECTIVE_ID = "finish-empireai-v1";
export const DEFAULT_OBJECTIVE_TITLE = "Finish EmpireAI Version 1";
export const SUGGESTED_NEXT_OBJECTIVE = "Grand King Commercial Launch";

export const DEFAULT_SUCCESS_CRITERIA: Array<{ id: string; label: string; journeyMarker: string }> =
  [
    { id: "pillow-017", label: "PILLOW-017 complete", journeyMarker: "PILLOW-017" },
    { id: "pillow-018", label: "PILLOW-018 complete", journeyMarker: "PILLOW-018" },
    { id: "pillow-019", label: "PILLOW-019 complete", journeyMarker: "PILLOW-019" },
    { id: "gc-03", label: "GC-03 complete", journeyMarker: "GC-03" },
    { id: "gc-05", label: "GC-05 complete", journeyMarker: "GC-05" },
    { id: "ux-contract", label: "UX Contract Closure complete", journeyMarker: "UX Contract Closure" },
    { id: "real-002b", label: "REAL-002B complete", journeyMarker: "REAL-002B" },
    { id: "proof-001", label: "PROOF-001 achieved", journeyMarker: "PROOF-001" },
    {
      id: "gk-golive",
      label: "GK-GOLIVE-APPROVAL complete",
      journeyMarker: "GK-GOLIVE",
    },
  ];

function criterionCompleteFromJourney(journeyText: string, marker: string): boolean {
  const upper = marker.toUpperCase();
  for (const line of journeyText.split("\n")) {
    if (line.toUpperCase().includes(upper) && line.includes("✅")) {
      return true;
    }
  }
  return false;
}

export function evaluateSuccessCriteria(
  _bootstrap: EmpireBootstrapContext,
  runtimeOverrides: Record<string, boolean> = {},
  journeyText = "",
): ObjectiveSuccessCriterion[] {
  return DEFAULT_SUCCESS_CRITERIA.map((criterion) => {
    const fromJourney = criterionCompleteFromJourney(journeyText, criterion.journeyMarker);
    const complete = runtimeOverrides[criterion.id] ?? fromJourney;
    return {
      id: criterion.id,
      label: criterion.label,
      complete,
    };
  });
}

export function computeProgress(criteria: ObjectiveSuccessCriterion[]): number {
  if (criteria.length === 0) return 0;
  const done = criteria.filter((c) => c.complete).length;
  return Math.round((done / criteria.length) * 100);
}

export function derivePhase(progress: number, complete: boolean): string {
  if (complete) return "complete";
  if (progress >= 80) return "final_validation";
  if (progress >= 50) return "integration";
  if (progress >= 25) return "runtime_completion";
  return "foundation";
}

export function deriveTasks(criteria: ObjectiveSuccessCriterion[]): {
  currentTask: string | null;
  nextTask: string | null;
  blockers: string[];
} {
  const incomplete = criteria.filter((c) => !c.complete);
  const blockers = incomplete.map((c) => c.label);
  return {
    currentTask: incomplete[0]?.label ?? null,
    nextTask: incomplete[1]?.label ?? null,
    blockers,
  };
}
