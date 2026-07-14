import {
  assembleTradeOffAnalysisEngine,
  buildFallbackTradeOffAnalysisEngine,
} from "@empireai/pillow";

/** Fallback Trade-off Analysis Engine when Pillow session is unavailable. */
export function collectTradeOffAnalysisEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-10",
    live: false,
    tradeOffAnalysisEngine: buildFallbackTradeOffAnalysisEngine(),
  };
}

export { assembleTradeOffAnalysisEngine, buildFallbackTradeOffAnalysisEngine };
