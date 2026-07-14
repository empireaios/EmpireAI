import {
  assembleOpportunityDiscoveryEngine,
  buildFallbackOpportunityDiscoveryEngine,
} from "@empireai/pillow";

/** Fallback Opportunity Discovery Engine when Pillow session is unavailable. */
export function collectOpportunityDiscoveryEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E4-03",
    live: false,
    opportunityDiscoveryEngine: buildFallbackOpportunityDiscoveryEngine(),
  };
}

export { assembleOpportunityDiscoveryEngine, buildFallbackOpportunityDiscoveryEngine };
