import { Q8_MISSION_CATALOG } from "./paths.js";
import type { Q8Mission, Q8MissionId } from "./types.js";

/** Fixed, observed Q8-01..Q8-08 pipeline map — never mutated per-run. */
export const Q8_MISSIONS: readonly Q8Mission[] = Q8_MISSION_CATALOG;

export function listMissionIds(): Q8MissionId[] {
  return Q8_MISSIONS.map((m) => m.missionId);
}

export function getMission(missionId: string): Q8Mission | undefined {
  return Q8_MISSIONS.find((m) => m.missionId === missionId);
}

export function getMissionByDependencyKey(dependencyKey: string): Q8Mission | undefined {
  return Q8_MISSIONS.find((m) => m.dependencyKey === dependencyKey);
}

/** Predecessor missions in the Q8-01..Q8-08 pipeline (evidence-only ordering, not enforced sequencing). */
export function precedingMissionIds(missionId: string): Q8MissionId[] {
  const index = Q8_MISSIONS.findIndex((m) => m.missionId === missionId);
  if (index <= 0) return [];
  return Q8_MISSIONS.slice(0, index).map((m) => m.missionId);
}
