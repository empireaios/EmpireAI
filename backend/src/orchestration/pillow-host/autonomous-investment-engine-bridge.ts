import { buildAutonomousInvestmentEngineConfiguration } from "@empireai/pillow";
import type { AutonomousInvestmentRunReport, AutonomousInvestmentState } from "@empireai/pillow";

/** Offline X5-12 snapshot used when the Pillow session is unavailable. */
export function collectAutonomousInvestmentEngineSnapshot() {
  const configuration = buildAutonomousInvestmentEngineConfiguration();
  const engine: AutonomousInvestmentState = {
    engineVersion: "PILLOW-AIE-001",
    missionId: "X5-12",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      totalInvestmentRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalInvestmentRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as AutonomousInvestmentRunReport | null,
    investmentRecords: [],
    recommendations: [],
  };
}
