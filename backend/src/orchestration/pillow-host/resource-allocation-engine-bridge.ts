import {
  assembleResourceAllocationEngine,
  buildFallbackResourceAllocationEngine,
} from "@empireai/pillow";

/** Fallback Resource Allocation Engine when Pillow session is unavailable. */
export function collectResourceAllocationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-05",
    live: false,
    resourceAllocationEngine: buildFallbackResourceAllocationEngine(),
  };
}

export { assembleResourceAllocationEngine, buildFallbackResourceAllocationEngine };
