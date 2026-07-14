import {
  assembleDecisionSimulationEngine,
  buildFallbackDecisionSimulationEngine,
} from "@empireai/pillow";

/** Fallback Decision Simulation Engine when Pillow session is unavailable. */
export function collectDecisionSimulationEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E2-03",
    live: false,
    decisionSimulationEngine: buildFallbackDecisionSimulationEngine(),
  };
}

export { assembleDecisionSimulationEngine, buildFallbackDecisionSimulationEngine };
