import { buildAutonomousEmpireEvolutionConfiguration } from "@empireai/pillow";
import type { AutonomousEmpireEvolutionRunReport, AutonomousEmpireEvolutionState } from "@empireai/pillow";

/** Offline X5-17 snapshot used when the Pillow session is unavailable. */
export function collectAutonomousEmpireEvolutionSnapshot() {
  const configuration = buildAutonomousEmpireEvolutionConfiguration();
  const engine: AutonomousEmpireEvolutionState = {
    engineVersion: "PILLOW-AEE-001",
    missionId: "X5-17",
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
      totalEvolutionRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalEvolutionRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as AutonomousEmpireEvolutionRunReport | null,
    evolutionRecords: [],
    recommendations: [],
  };
}
