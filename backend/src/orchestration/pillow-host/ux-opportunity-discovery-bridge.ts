import { buildUxOpportunityDiscoveryConfiguration } from "@empireai/pillow";
import type {
  OpportunityDiscoveryRunReport,
  UxOpportunityDiscoveryState,
} from "@empireai/pillow";

function buildOfflineUxOpportunityDiscoveryState(): UxOpportunityDiscoveryState {
  const configuration = buildUxOpportunityDiscoveryConfiguration();
  return {
    engineVersion: "PILLOW-UOD-001",
    missionId: "T5-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    topOpportunities: [],
    health: {
      status: "standby",
      healthScore: 50,
      discoveryEnabled: configuration.enabled,
      continuousDiscoveryActive: false,
      lastDiscoveryAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalDiscoveries: 0,
      successfulDiscoveries: 0,
      failedDiscoveries: 0,
      totalOpportunitiesDiscovered: 0,
      layoutOpportunities: 0,
      componentOpportunities: 0,
      navigationOpportunities: 0,
      workflowOpportunities: 0,
      accessibilityOpportunities: 0,
      consistencyOpportunities: 0,
      duplicatesSkipped: 0,
      averageDiscoveryDurationMs: 0,
      peakDiscoveryDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback UX Opportunity Discovery snapshot when Pillow session is unavailable. */
export function collectUxOpportunityDiscoverySnapshot() {
  const engine = buildOfflineUxOpportunityDiscoveryState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousDiscoveryActive: false,
      totalDiscoveries: 0,
      totalOpportunitiesDiscovered: 0,
      topPriorityCount: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as OpportunityDiscoveryRunReport | null,
    activeSession: null,
    topOpportunities: [],
  };
}
