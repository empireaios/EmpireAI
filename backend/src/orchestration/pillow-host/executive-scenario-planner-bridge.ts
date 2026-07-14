import {
  assembleExecutiveScenarioPlanner,
  buildFallbackExecutiveScenarioPlanner,
} from "@empireai/pillow";

/** Fallback Executive Scenario Planner when Pillow session is unavailable. */
export function collectExecutiveScenarioPlannerSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-10",
    live: false,
    executiveScenarioPlanner: buildFallbackExecutiveScenarioPlanner(),
  };
}

export { assembleExecutiveScenarioPlanner, buildFallbackExecutiveScenarioPlanner };
