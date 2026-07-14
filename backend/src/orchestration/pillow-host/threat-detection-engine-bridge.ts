import {
  assembleThreatDetectionEngine,
  buildFallbackThreatDetectionEngine,
} from "@empireai/pillow";

/** Fallback Threat Detection Engine when Pillow session is unavailable. */
export function collectThreatDetectionEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-04",
    live: false,
    threatDetectionEngine: buildFallbackThreatDetectionEngine(),
  };
}

export { assembleThreatDetectionEngine, buildFallbackThreatDetectionEngine };
