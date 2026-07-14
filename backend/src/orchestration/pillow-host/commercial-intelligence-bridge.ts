import {
  assembleCommercialIntelligenceArchitecture,
  buildFallbackCommercialIntelligenceArchitecture,
} from "@empireai/pillow";

/** Fallback Commercial Intelligence when Pillow session is unavailable. */
export function collectCommercialIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-05",
    live: false,
    commercialIntelligence: buildFallbackCommercialIntelligenceArchitecture(),
  };
}

export { assembleCommercialIntelligenceArchitecture, buildFallbackCommercialIntelligenceArchitecture };
