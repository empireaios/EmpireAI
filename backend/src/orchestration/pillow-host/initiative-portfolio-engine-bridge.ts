import {
  assembleInitiativePortfolioEngine,
  buildFallbackInitiativePortfolioEngine,
} from "@empireai/pillow";

/** Fallback Initiative Portfolio Engine when Pillow session is unavailable. */
export function collectInitiativePortfolioEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-06",
    live: false,
    initiativePortfolioEngine: buildFallbackInitiativePortfolioEngine(),
  };
}

export { assembleInitiativePortfolioEngine, buildFallbackInitiativePortfolioEngine };
