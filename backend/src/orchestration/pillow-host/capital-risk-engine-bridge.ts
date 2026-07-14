import {
  assembleCapitalRiskEngine,
  buildFallbackCapitalRiskEngine,
} from "@empireai/pillow";

/** Fallback Capital Risk Engine when Pillow session is unavailable. */
export function collectCapitalRiskEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-11",
    live: false,
    capitalRiskEngine: buildFallbackCapitalRiskEngine(),
  };
}

export { assembleCapitalRiskEngine, buildFallbackCapitalRiskEngine };
