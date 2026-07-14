import {
  assembleExecutiveBudgetPlanner,
  buildFallbackExecutiveBudgetPlanner,
} from "@empireai/pillow";

/** Fallback Executive Budget Planner when Pillow session is unavailable. */
export function collectExecutiveBudgetPlannerSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-03",
    live: false,
    executiveBudgetPlanner: buildFallbackExecutiveBudgetPlanner(),
  };
}

export { assembleExecutiveBudgetPlanner, buildFallbackExecutiveBudgetPlanner };
