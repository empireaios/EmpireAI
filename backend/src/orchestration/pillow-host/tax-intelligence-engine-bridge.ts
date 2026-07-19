import { buildTaxIntelligenceEngineConfiguration } from "@empireai/pillow";
import type {
  TaxIntelligenceRunReport,
  TaxIntelligenceEngineState,
} from "@empireai/pillow";

function buildOfflineTaxIntelligenceEngineState(): TaxIntelligenceEngineState {
  const configuration = buildTaxIntelligenceEngineConfiguration();
  return {
    engineVersion: "PILLOW-TX-001",
    missionId: "R3-11",
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
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalTaxRecords: 0,
      aggregateTaxAmount: 0,
      lastTaxStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      transactionsClassified: 0,
      liabilitiesCalculated: 0,
      adjustmentsCalculated: 0,
      taxPaymentsRecorded: 0,
      summariesGenerated: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Tax Intelligence Engine snapshot when Pillow session is unavailable. */
export function collectTaxIntelligenceEngineSnapshot() {
  const engine = buildOfflineTaxIntelligenceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalTaxRecords: 0,
      aggregateTaxAmount: 0,
      lastTaxStatus: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as TaxIntelligenceRunReport | null,
    taxRecords: [],
  };
}
