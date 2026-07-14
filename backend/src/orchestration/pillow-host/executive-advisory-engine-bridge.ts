import {
  assembleExecutiveAdvisoryEngine,
  buildFallbackExecutiveAdvisoryEngine,
} from "@empireai/pillow";

/** Fallback Executive Advisory Engine when Pillow session is unavailable. */
export function collectExecutiveAdvisoryEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-14",
    live: false,
    executiveAdvisoryEngine: buildFallbackExecutiveAdvisoryEngine(),
  };
}

export { assembleExecutiveAdvisoryEngine, buildFallbackExecutiveAdvisoryEngine };
