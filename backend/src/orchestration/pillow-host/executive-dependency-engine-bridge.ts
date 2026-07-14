import {
  assembleExecutiveDependencyEngine,
  buildFallbackExecutiveDependencyEngine,
} from "@empireai/pillow";

/** Fallback Executive Dependency Engine when Pillow session is unavailable. */
export function collectExecutiveDependencyEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-09",
    live: false,
    executiveDependencyEngine: buildFallbackExecutiveDependencyEngine(),
  };
}

export { assembleExecutiveDependencyEngine, buildFallbackExecutiveDependencyEngine };
