import { buildCivilizationKnowledgeEngineConfiguration } from "@empireai/pillow";
import type { CivilizationKnowledgeRunReport, CivilizationKnowledgeState } from "@empireai/pillow";

/** Offline X5-16 snapshot used when the Pillow session is unavailable. */
export function collectCivilizationKnowledgeEngineSnapshot() {
  const configuration = buildCivilizationKnowledgeEngineConfiguration();
  const engine: CivilizationKnowledgeState = {
    engineVersion: "PILLOW-CKE-001",
    missionId: "X5-16",
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
      totalKnowledgeRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
  };
  return {
    computedAt: new Date().toISOString(),
    missionId: "X5-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalKnowledgeRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CivilizationKnowledgeRunReport | null,
    knowledgeRecords: [],
    recommendations: [],
  };
}
