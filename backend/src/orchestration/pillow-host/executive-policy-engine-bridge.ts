import {
  assembleExecutivePolicyEngine,
  buildFallbackExecutivePolicyEngine,
} from "@empireai/pillow";

/** Fallback Executive Policy Engine when Pillow session is unavailable. */
export function collectExecutivePolicyEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-12",
    live: false,
    executivePolicyEngine: buildFallbackExecutivePolicyEngine(),
  };
}

export { assembleExecutivePolicyEngine, buildFallbackExecutivePolicyEngine };
