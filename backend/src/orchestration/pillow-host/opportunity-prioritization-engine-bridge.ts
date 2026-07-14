import {
  assembleOpportunityPrioritizationEngine,
  buildFallbackOpportunityPrioritizationEngine,
} from "@empireai/pillow";

/** Fallback Opportunity Prioritization Engine when Pillow session is unavailable. */
export function collectOpportunityPrioritizationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E1-12",
    live: false,
    opportunityPrioritizationEngine: buildFallbackOpportunityPrioritizationEngine(),
  };
}

export { assembleOpportunityPrioritizationEngine, buildFallbackOpportunityPrioritizationEngine };
