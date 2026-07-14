import {
  assembleLongTermGrowthPlanner,
  buildFallbackLongTermGrowthPlanner,
} from "@empireai/pillow";

/** Fallback Long-Term Growth Planner when Pillow session is unavailable. */
export function collectLongTermGrowthPlannerSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-11",
    live: false,
    longTermGrowthPlanner: buildFallbackLongTermGrowthPlanner(),
  };
}

export { assembleLongTermGrowthPlanner, buildFallbackLongTermGrowthPlanner };
