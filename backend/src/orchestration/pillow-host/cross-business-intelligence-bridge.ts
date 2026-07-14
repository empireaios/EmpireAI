import {
  assembleCrossBusinessIntelligence,
  buildFallbackCrossBusinessIntelligence,
} from "@empireai/pillow";

/** Fallback Cross-Business Intelligence when Pillow session is unavailable. */
export function collectCrossBusinessIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-13",
    live: false,
    crossBusinessIntelligence: buildFallbackCrossBusinessIntelligence(),
  };
}

export { assembleCrossBusinessIntelligence, buildFallbackCrossBusinessIntelligence };
