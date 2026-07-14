import {
  assembleExecutivePerformanceDashboard,
  buildFallbackExecutivePerformanceDashboard,
} from "@empireai/pillow";

/** Fallback Executive Performance Dashboard when Pillow session is unavailable. */
export function collectExecutivePerformanceDashboardSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-13",
    live: false,
    executivePerformanceDashboard: buildFallbackExecutivePerformanceDashboard(),
  };
}

export { assembleExecutivePerformanceDashboard, buildFallbackExecutivePerformanceDashboard };
