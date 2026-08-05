import { Q9_MISSION_CATALOG } from "./paths.js";
import type { Q9Mission, Q9MissionId } from "./types.js";

/** Fixed, observed Q9-01..Q9-10 pipeline map — never mutated per-run. */
export const Q9_MISSIONS: readonly Q9Mission[] = Q9_MISSION_CATALOG;

export function listMissionIds(): Q9MissionId[] {
  return Q9_MISSIONS.map((m) => m.missionId);
}

export function getMission(missionId: string): Q9Mission | undefined {
  return Q9_MISSIONS.find((m) => m.missionId === missionId);
}

export function getMissionByDependencyKey(dependencyKey: string): Q9Mission | undefined {
  return Q9_MISSIONS.find((m) => m.dependencyKey === dependencyKey);
}

/** Predecessor missions in the Q9-01..Q9-10 pipeline (evidence-only ordering). */
export function precedingMissionIds(missionId: string): Q9MissionId[] {
  const index = Q9_MISSIONS.findIndex((m) => m.missionId === missionId);
  if (index <= 0) return [];
  return Q9_MISSIONS.slice(0, index).map((m) => m.missionId);
}

/** Reject Q10+ mission ids — Q9-11 itself is allowed. */
export function isForbiddenMissionId(missionId: string): boolean {
  return /^Q1[0-9]-/i.test(missionId.trim()) || /^Q[2-9]\d-/i.test(missionId.trim());
}
