import {
  assembleProfitOptimizationEngine,
  buildFallbackProfitOptimizationEngine,
} from "@empireai/pillow";

/** Fallback Profit Optimization Engine when Pillow session is unavailable. */
export function collectProfitOptimizationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-07",
    live: false,
    profitOptimizationEngine: buildFallbackProfitOptimizationEngine(),
  };
}

export { assembleProfitOptimizationEngine, buildFallbackProfitOptimizationEngine };
