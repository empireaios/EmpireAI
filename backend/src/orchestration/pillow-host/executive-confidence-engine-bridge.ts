import {
  assembleExecutiveConfidenceEngine,
  buildFallbackExecutiveConfidenceEngine,
} from "@empireai/pillow";

/** Fallback Executive Confidence Engine when Pillow session is unavailable. */
export function collectExecutiveConfidenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-14",
    live: false,
    executiveConfidenceEngine: buildFallbackExecutiveConfidenceEngine(),
  };
}

export { assembleExecutiveConfidenceEngine, buildFallbackExecutiveConfidenceEngine };
