import {
  assembleExecutivePlanningDashboard,
  buildFallbackExecutivePlanningDashboard,
} from "@empireai/pillow";

/** Fallback Executive Planning Dashboard when Pillow session is unavailable. */
export function collectExecutivePlanningDashboardSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-14",
    live: false,
    executivePlanningDashboard: buildFallbackExecutivePlanningDashboard(),
  };
}

export { assembleExecutivePlanningDashboard, buildFallbackExecutivePlanningDashboard };
