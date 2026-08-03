import { buildEmpireOpportunityEngineConfiguration } from "@empireai/pillow";
import type { EmpireOpportunityRunReport, EmpireOpportunityState } from "@empireai/pillow";

/** Offline X5-06 snapshot used when the Pillow session is unavailable. */
export function collectEmpireOpportunityEngineSnapshot() {
  const configuration = buildEmpireOpportunityEngineConfiguration();
  const engine: EmpireOpportunityState = {
    engineVersion: "PILLOW-EOP-001", missionId: "X5-06", status: "idle", initializedAt: new Date().toISOString(), configuration, latestReport: null, engineRecord: null,
    health: { status: "standby", healthScore: 50, engineEnabled: configuration.enabled, lastOperationAt: null, lastValidationDecision: null, totalOpportunityRecords: 0, notes: ["Pillow session unavailable — offline snapshot"] },
  };
  return { computedAt: new Date().toISOString(), missionId: "X5-06", live: false, engine, cockpit: { engineStatus: engine.status, healthStatus: engine.health.status, operationalState: null, lastDecision: null, totalOpportunityRecords: 0, frameworkRegistered: false, dependenciesConnected: 0, recentLogs: [] as string[] }, latestReport: null as EmpireOpportunityRunReport | null, opportunityRecords: [], recommendations: [] };
}
