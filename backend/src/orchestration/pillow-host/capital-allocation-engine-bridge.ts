import {
  assembleCapitalAllocationEngine,
  buildFallbackCapitalAllocationEngine,
} from "@empireai/pillow";

/** Fallback Capital Allocation Engine when Pillow session is unavailable. */
export function collectCapitalAllocationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-02",
    live: false,
    capitalAllocationEngine: buildFallbackCapitalAllocationEngine(),
  };
}

export { assembleCapitalAllocationEngine, buildFallbackCapitalAllocationEngine };
