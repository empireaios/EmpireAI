import { Q10_RUNTIME_CATALOG } from "./paths.js";
import type { Q10Runtime, Q10RuntimeId } from "./types.js";

/** Fixed, observed Q10-01..Q10-13 pipeline map — never mutated per-run. */
export const Q10_RUNTIMES: readonly Q10Runtime[] = Q10_RUNTIME_CATALOG;

export function listRuntimeIds(): Q10RuntimeId[] {
  return Q10_RUNTIMES.map((r) => r.missionId);
}

export function getRuntime(missionId: string): Q10Runtime | undefined {
  return Q10_RUNTIMES.find((r) => r.missionId === missionId);
}

export function getRuntimeByDependencyKey(dependencyKey: string): Q10Runtime | undefined {
  return Q10_RUNTIMES.find((r) => r.dependencyKey === dependencyKey);
}

/** Predecessor runtimes in the Q10-01..Q10-13 pipeline (evidence-only ordering). */
export function precedingRuntimeIds(missionId: string): Q10RuntimeId[] {
  const index = Q10_RUNTIMES.findIndex((r) => r.missionId === missionId);
  if (index <= 0) return [];
  return Q10_RUNTIMES.slice(0, index).map((r) => r.missionId);
}

/** Reject Q11+ mission ids — Q10-14 itself (and Q10-01..Q10-13) is allowed. */
export function isForbiddenMissionId(missionId: string): boolean {
  return /^Q1[1-9]-/i.test(missionId.trim()) || /^Q[2-9]\d-/i.test(missionId.trim());
}
