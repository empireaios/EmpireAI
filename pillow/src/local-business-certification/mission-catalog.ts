import { Q7_MISSION_CATALOG } from "./paths.js";
import type { Q7Mission, Q7MissionId } from "./types.js";

/** Fixed, observed Q7-01..Q7-10 pipeline map — never mutated per-run. */
export const Q7_MISSIONS: readonly Q7Mission[] = Q7_MISSION_CATALOG;

export function listMissionIds(): Q7MissionId[] {
  return Q7_MISSIONS.map((m) => m.missionId);
}

export function getMission(missionId: string): Q7Mission | undefined {
  return Q7_MISSIONS.find((m) => m.missionId === missionId);
}

export function getMissionByDependencyKey(dependencyKey: string): Q7Mission | undefined {
  return Q7_MISSIONS.find((m) => m.dependencyKey === dependencyKey);
}

/** Predecessor missions in the Q7-01..Q7-10 pipeline (evidence-only ordering, not enforced sequencing). */
export function precedingMissionIds(missionId: string): Q7MissionId[] {
  const index = Q7_MISSIONS.findIndex((m) => m.missionId === missionId);
  if (index <= 0) return [];
  return Q7_MISSIONS.slice(0, index).map((m) => m.missionId);
}
