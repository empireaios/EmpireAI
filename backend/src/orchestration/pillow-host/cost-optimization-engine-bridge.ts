import {
  assembleCostOptimizationEngine,
  buildFallbackCostOptimizationEngine,
} from "@empireai/pillow";

/** Fallback Cost Optimization Engine when Pillow session is unavailable. */
export function collectCostOptimizationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-08",
    live: false,
    costOptimizationEngine: buildFallbackCostOptimizationEngine(),
  };
}

export { assembleCostOptimizationEngine, buildFallbackCostOptimizationEngine };
