import {
  assembleExecutiveCalendarEngine,
  buildFallbackExecutiveCalendarEngine,
} from "@empireai/pillow";

/** Fallback Executive Calendar Engine when Pillow session is unavailable. */
export function collectExecutiveCalendarEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-08",
    live: false,
    executiveCalendarEngine: buildFallbackExecutiveCalendarEngine(),
  };
}

export { assembleExecutiveCalendarEngine, buildFallbackExecutiveCalendarEngine };
