import { buildEmpireKnowledgeEngineConfiguration } from "@empireai/pillow";
import type { EmpireKnowledgeRunReport, EmpireKnowledgeState } from "@empireai/pillow";

/** Offline X5-02 snapshot used when the Pillow session is unavailable. */
export function collectEmpireKnowledgeEngineSnapshot() {
  const configuration = buildEmpireKnowledgeEngineConfiguration();
  const engine: EmpireKnowledgeState = {
    engineVersion: "PILLOW-ENK-001", missionId: "X5-02", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalKnowledgeRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-02", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalKnowledgeRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireKnowledgeRunReport | null, knowledgeRecords: [], recommendations: [] };
}
