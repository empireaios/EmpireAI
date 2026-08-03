import { buildLanguageIntelligenceConfiguration } from "@empireai/pillow";
import type {
  LanguageIntelligenceEngineState,
  LiRunReport,
} from "@empireai/pillow";

function buildOfflineLanguageIntelligenceState(): LanguageIntelligenceEngineState {
  const configuration = buildLanguageIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-LI-001",
    missionId: "X4-04",
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
      totalLanguageRecords: 0,
      unsupportedCount: 0,
      averageQualityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      languageDetections: 0,
      customerTranslations: 0,
      operationalTranslations: 0,
      aiWorkforceTranslations: 0,
      terminologyOperations: 0,
      qualityAnalyses: 0,
      unsupportedDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Language Intelligence snapshot when Pillow session is unavailable. */
export function collectLanguageIntelligenceSnapshot() {
  const engine = buildOfflineLanguageIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLanguageRecords: 0,
      unsupportedCount: 0,
      averageQualityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as LiRunReport | null,
    languageRecords: [],
    recommendations: [],
  };
}
