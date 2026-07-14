import {
  assembleMarketIntelligenceEngine,
  buildFallbackMarketIntelligenceEngine,
} from "@empireai/pillow";

/** Fallback Market Intelligence Engine when Pillow session is unavailable. */
export function collectMarketIntelligenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-01",
    live: false,
    marketIntelligenceEngine: buildFallbackMarketIntelligenceEngine(),
  };
}

export { assembleMarketIntelligenceEngine, buildFallbackMarketIntelligenceEngine };
