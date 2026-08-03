import { buildPortfolioIntelligenceCertifiedConfiguration } from "@empireai/pillow";
import type {
  PortfolioIntelligenceCertifiedState,
  PortfolioIntelligenceCertificationRunReport,
} from "@empireai/pillow";

function buildOfflinePortfolioIntelligenceCertifiedState(): PortfolioIntelligenceCertifiedState {
  const configuration = buildPortfolioIntelligenceCertifiedConfiguration();
  return {
    engineVersion: "PILLOW-PIC-001",
    missionId: "X2-10",
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
      totalCertificationReports: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      certificationsRun: 0,
      moduleValidationsRun: 0,
      endToEndRuns: 0,
      reportRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Intelligence Certified snapshot when Pillow session is unavailable. */
export function collectPortfolioIntelligenceCertifiedSnapshot() {
  const engine = buildOfflinePortfolioIntelligenceCertifiedState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCertificationReports: 0,
      overallCertificationStatus: null,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { PortfolioIntelligenceCertificationRunReport };
