import { buildCrossRegionLearningEngineConfiguration } from "@empireai/pillow";
import type { CrossRegionLearningState, CrlRunReport } from "@empireai/pillow";

/** Offline X4-16 snapshot used when the Pillow session is unavailable. */
export function collectCrossRegionLearningEngineSnapshot() {
  const configuration = buildCrossRegionLearningEngineConfiguration();
  const engine: CrossRegionLearningState = {
    engineVersion: "PILLOW-CRL-001", missionId: "X4-16", status: "idle",
    initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalLearningRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X4-16", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalLearningRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as CrlRunReport | null, learningRecords: [], recommendations: [] };
}
