import {
  assembleCrisisDecisionEngine,
  buildFallbackCrisisDecisionEngine,
} from "@empireai/pillow";

/** Fallback Crisis Decision Engine when Pillow session is unavailable. */
export function collectCrisisDecisionEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-08",
    live: false,
    crisisDecisionEngine: buildFallbackCrisisDecisionEngine(),
  };
}

export { assembleCrisisDecisionEngine, buildFallbackCrisisDecisionEngine };
