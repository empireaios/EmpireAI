import {
  assembleFinancialScenarioEngine,
  buildFallbackFinancialScenarioEngine,
} from "@empireai/pillow";

/** Fallback Financial Scenario Engine when Pillow session is unavailable. */
export function collectFinancialScenarioEngineSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-09",
    live: false,
    financialScenarioEngine: buildFallbackFinancialScenarioEngine(),
  };
}

export { assembleFinancialScenarioEngine, buildFallbackFinancialScenarioEngine };
