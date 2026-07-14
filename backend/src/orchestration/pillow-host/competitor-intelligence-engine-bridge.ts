import {
  assembleCompetitorIntelligenceEngine,
  buildFallbackCompetitorIntelligenceEngine,
} from "@empireai/pillow";

/** Fallback Competitor Intelligence Engine when Pillow session is unavailable. */
export function collectCompetitorIntelligenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-02",
    live: false,
    competitorIntelligenceEngine: buildFallbackCompetitorIntelligenceEngine(),
  };
}

export { assembleCompetitorIntelligenceEngine, buildFallbackCompetitorIntelligenceEngine };
