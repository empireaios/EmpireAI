import {
  assembleExecutiveInsightEngine,
  buildFallbackExecutiveInsightEngine,
} from "@empireai/pillow";

/** Fallback Executive Insight Engine when Pillow session is unavailable. */
export function collectExecutiveInsightEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-10",
    live: false,
    executiveInsightEngine: buildFallbackExecutiveInsightEngine(),
  };
}

export { assembleExecutiveInsightEngine, buildFallbackExecutiveInsightEngine };
