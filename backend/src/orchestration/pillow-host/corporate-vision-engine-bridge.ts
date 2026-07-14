import {
  assembleCorporateVisionEngine,
  buildFallbackCorporateVisionEngine,
} from "@empireai/pillow";

/** Fallback Corporate Vision Engine when Pillow session is unavailable. */
export function collectCorporateVisionEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-02",
    live: false,
    corporateVisionEngine: buildFallbackCorporateVisionEngine(),
  };
}

export { assembleCorporateVisionEngine, buildFallbackCorporateVisionEngine };
