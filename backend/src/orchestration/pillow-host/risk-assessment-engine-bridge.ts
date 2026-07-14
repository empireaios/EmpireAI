import {
  assembleRiskAssessmentEngine,
  buildFallbackRiskAssessmentEngine,
} from "@empireai/pillow";

/** Fallback Risk Assessment Engine when Pillow session is unavailable. */
export function collectRiskAssessmentEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-02",
    live: false,
    riskAssessmentEngine: buildFallbackRiskAssessmentEngine(),
  };
}

export { assembleRiskAssessmentEngine, buildFallbackRiskAssessmentEngine };
