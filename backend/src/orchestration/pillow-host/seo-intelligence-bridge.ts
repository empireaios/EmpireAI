import { buildSeoIntelligenceConfiguration } from "@empireai/pillow";
import type { SeoIntelligenceState, SeoRunReport } from "@empireai/pillow";

function buildOfflineSeoIntelligenceState(): SeoIntelligenceState {
  const configuration = buildSeoIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-SIE-001",
    missionId: "R5-06",
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
      totalProjects: 0,
      totalPagesAnalyzed: 0,
      totalKeywords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      pagesAnalyzed: 0,
      keywordsTracked: 0,
      rankingsUpdated: 0,
      recommendationsGenerated: 0,
      issuesDetected: 0,
      organicPerformanceChecks: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback SEO Intelligence snapshot when Pillow session is unavailable. */
export function collectSeoIntelligenceSnapshot() {
  const engine = buildOfflineSeoIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      pagesAnalyzed: 0,
      keywordsTracked: 0,
      frameworkRegistered: false,
      journeyIntelligenceConnected: false,
      recentLogs: [],
    },
    latestReport: null as SeoRunReport | null,
    seoRecords: [],
  };
}
