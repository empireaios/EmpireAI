import {
  assembleExecutiveCapitalStrategy,
  buildFallbackExecutiveCapitalStrategy,
} from "@empireai/pillow";

/** Fallback Executive Capital Strategy when Pillow session is unavailable. */
export function collectExecutiveCapitalStrategySnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-15",
    live: false,
    executiveCapitalStrategy: buildFallbackExecutiveCapitalStrategy(),
  };
}

export { assembleExecutiveCapitalStrategy, buildFallbackExecutiveCapitalStrategy };
