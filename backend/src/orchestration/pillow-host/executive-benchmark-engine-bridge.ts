import {
  assembleExecutiveBenchmarkEngine,
  buildFallbackExecutiveBenchmarkEngine,
} from "@empireai/pillow";

/** Fallback Executive Benchmark Engine when Pillow session is unavailable. */
export function collectExecutiveBenchmarkEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-12",
    live: false,
    executiveBenchmarkEngine: buildFallbackExecutiveBenchmarkEngine(),
  };
}

export { assembleExecutiveBenchmarkEngine, buildFallbackExecutiveBenchmarkEngine };
