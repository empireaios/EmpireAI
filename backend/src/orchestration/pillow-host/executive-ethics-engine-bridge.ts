import {
  assembleExecutiveEthicsEngine,
  buildFallbackExecutiveEthicsEngine,
} from "@empireai/pillow";

/** Fallback Executive Ethics Engine when Pillow session is unavailable. */
export function collectExecutiveEthicsEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-05",
    live: false,
    executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
  };
}

export { assembleExecutiveEthicsEngine, buildFallbackExecutiveEthicsEngine };
