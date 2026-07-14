import {
  assembleInnovationIntelligenceEngine,
  buildFallbackInnovationIntelligenceEngine,
} from "@empireai/pillow";

/** Fallback Innovation Intelligence Engine when Pillow session is unavailable. */
export function collectInnovationIntelligenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-07",
    live: false,
    innovationIntelligenceEngine: buildFallbackInnovationIntelligenceEngine(),
  };
}

export { assembleInnovationIntelligenceEngine, buildFallbackInnovationIntelligenceEngine };
