import { buildGrandKingAdvisoryEngineConfiguration } from "@empireai/pillow";
import type { GrandKingAdvisoryRunReport, GrandKingAdvisoryState } from "@empireai/pillow";

/** Offline X5-15 snapshot used when the Pillow session is unavailable. */
export function collectGrandKingAdvisoryEngineSnapshot() {
  const configuration = buildGrandKingAdvisoryEngineConfiguration();
  const engine: GrandKingAdvisoryState = {
    engineVersion: "PILLOW-GKA-001",
    missionId: "X5-15",
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
      totalAdvisoryRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAdvisoryRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as GrandKingAdvisoryRunReport | null,
    advisoryRecords: [],
    recommendations: [],
  };
}
