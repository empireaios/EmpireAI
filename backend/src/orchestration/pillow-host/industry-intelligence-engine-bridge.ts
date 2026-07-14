import {
  assembleIndustryIntelligenceEngine,
  buildFallbackIndustryIntelligenceEngine,
} from "@empireai/pillow";

/** Fallback Industry Intelligence Engine when Pillow session is unavailable. */
export function collectIndustryIntelligenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-05",
    live: false,
    industryIntelligenceEngine: buildFallbackIndustryIntelligenceEngine(),
  };
}

export { assembleIndustryIntelligenceEngine, buildFallbackIndustryIntelligenceEngine };
