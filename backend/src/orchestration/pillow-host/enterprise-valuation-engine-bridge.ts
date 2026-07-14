import {
  assembleEnterpriseValuationEngine,
  buildFallbackEnterpriseValuationEngine,
} from "@empireai/pillow";

/** Fallback Enterprise Valuation Engine when Pillow session is unavailable. */
export function collectEnterpriseValuationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-14",
    live: false,
    enterpriseValuationEngine: buildFallbackEnterpriseValuationEngine(),
  };
}

export { assembleEnterpriseValuationEngine, buildFallbackEnterpriseValuationEngine };
