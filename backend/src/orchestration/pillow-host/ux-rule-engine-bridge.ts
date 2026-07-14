import { buildUxRuleEngineConfiguration } from "@empireai/pillow";
import type { RuleValidationReport, UxRuleEngineState } from "@empireai/pillow";

function buildOfflineUxRuleEngineState(): UxRuleEngineState {
  const configuration = buildUxRuleEngineConfiguration();
  return {
    engineVersion: "PILLOW-URE-001",
    missionId: "T2-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    rulesLoaded: 0,
    rulesEnabled: 0,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      rulesLoaded: 0,
      rulesEnabled: 0,
      lastValidationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      totalRulesEvaluated: 0,
      totalViolations: 0,
      averageValidationDurationMs: 0,
      peakValidationDurationMs: 0,
    },
  };
}

/** Fallback UX Rule Engine snapshot when Pillow session is unavailable. */
export function collectUxRuleEngineSnapshot() {
  const engine = buildOfflineUxRuleEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      rulesLoaded: 0,
      rulesEnabled: 0,
      lastDecision: null,
      violationsCount: 0,
      totalValidations: 0,
      recentLogs: [],
    },
    latestReport: null as RuleValidationReport | null,
  };
}
