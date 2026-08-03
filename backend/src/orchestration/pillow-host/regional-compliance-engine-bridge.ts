import { buildRegionalComplianceEngineConfiguration } from "@empireai/pillow";
import type {
  RegionalComplianceEngineState,
  RceRunReport,
} from "@empireai/pillow";

function buildOfflineRegionalComplianceEngineState(): RegionalComplianceEngineState {
  const configuration = buildRegionalComplianceEngineConfiguration();
  return {
    engineVersion: "PILLOW-RCE-001",
    missionId: "X4-06",
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
      totalComplianceRecords: 0,
      violationCount: 0,
      highRiskCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      countryRequirementOps: 0,
      regulatoryMonitors: 0,
      businessRuleOps: 0,
      operationalAssessments: 0,
      marketplaceAssessments: 0,
      dataProtectionAssessments: 0,
      violationDetections: 0,
      riskAssessments: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Regional Compliance Engine snapshot when Pillow session is unavailable. */
export function collectRegionalComplianceEngineSnapshot() {
  const engine = buildOfflineRegionalComplianceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalComplianceRecords: 0,
      violationCount: 0,
      highRiskCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as RceRunReport | null,
    complianceRecords: [],
    recommendations: [],
  };
}
