import {
  assembleDepartmentPlanningEngine,
  buildFallbackDepartmentPlanningEngine,
} from "@empireai/pillow";

/** Fallback Department Planning Engine when Pillow session is unavailable. */
export function collectDepartmentPlanningEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-07",
    live: false,
    departmentPlanningEngine: buildFallbackDepartmentPlanningEngine(),
  };
}

export { assembleDepartmentPlanningEngine, buildFallbackDepartmentPlanningEngine };
