import {
  assembleExecutiveAccountabilityEngine,
  buildFallbackExecutiveAccountabilityEngine,
} from "@empireai/pillow";

/** Fallback Executive Accountability Engine when Pillow session is unavailable. */
export function collectExecutiveAccountabilityEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-06",
    live: false,
    executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
  };
}

export { assembleExecutiveAccountabilityEngine, buildFallbackExecutiveAccountabilityEngine };
