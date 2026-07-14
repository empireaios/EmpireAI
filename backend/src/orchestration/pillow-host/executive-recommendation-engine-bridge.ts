import {
  assembleExecutiveRecommendationEngine,
  buildFallbackExecutiveRecommendationEngine,
} from "@empireai/pillow";

/** Fallback Executive Recommendation Engine when Pillow session is unavailable. */
export function collectExecutiveRecommendationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-04",
    live: false,
    executiveRecommendationEngine: buildFallbackExecutiveRecommendationEngine(),
  };
}

export { assembleExecutiveRecommendationEngine, buildFallbackExecutiveRecommendationEngine };
