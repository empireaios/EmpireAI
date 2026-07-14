import {
  assembleRoiIntelligenceEngine,
  buildFallbackRoiIntelligenceEngine,
} from "@empireai/pillow";

/** Fallback ROI Intelligence Engine when Pillow session is unavailable. */
export function collectRoiIntelligenceEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-05",
    live: false,
    roiIntelligenceEngine: buildFallbackRoiIntelligenceEngine(),
  };
}

export { assembleRoiIntelligenceEngine, buildFallbackRoiIntelligenceEngine };
