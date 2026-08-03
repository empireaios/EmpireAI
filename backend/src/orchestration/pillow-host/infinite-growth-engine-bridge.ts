import { buildInfiniteGrowthEngineConfiguration } from "@empireai/pillow";
import type { InfiniteGrowthRunReport, InfiniteGrowthState } from "@empireai/pillow";

/** Offline X5-19 snapshot used when the Pillow session is unavailable. */
export function collectInfiniteGrowthEngineSnapshot() {
  const configuration = buildInfiniteGrowthEngineConfiguration();
  const engine: InfiniteGrowthState = {
    engineVersion: "PILLOW-IGE-001",
    missionId: "X5-19",
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
      totalGrowthRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-19",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalGrowthRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as InfiniteGrowthRunReport | null,
    growthRecords: [],
    recommendations: [],
  };
}
