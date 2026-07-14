import {
  assembleExecutiveForecastIntelligence,
  buildFallbackExecutiveForecastIntelligence,
} from "@empireai/pillow";

/** Fallback Executive Forecast Intelligence when Pillow session is unavailable. */
export function collectExecutiveForecastIntelligenceSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-12",
    live: false,
    executiveForecastIntelligence: buildFallbackExecutiveForecastIntelligence(),
  };
}

export { assembleExecutiveForecastIntelligence, buildFallbackExecutiveForecastIntelligence };
