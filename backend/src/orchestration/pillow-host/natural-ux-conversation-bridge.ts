import { buildNaturalUxConversationConfiguration } from "@empireai/pillow";
import type { NaturalUxConversationState, ConversationRunReport } from "@empireai/pillow";

function buildOfflineNaturalUxConversationState(): NaturalUxConversationState {
  const configuration = buildNaturalUxConversationConfiguration();
  return {
    engineVersion: "PILLOW-NUC-001",
    missionId: "T4-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      conversationEnabled: configuration.enabled,
      conversationsCompleted: 0,
      lastConversationAt: null,
      lastConversationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalConversations: 0,
      successfulConversations: 0,
      failedConversations: 0,
      totalTurns: 0,
      clarificationsRequested: 0,
      builderRequestsGenerated: 0,
      averageConversationDurationMs: 0,
      peakConversationDurationMs: 0,
    },
  };
}

/** Fallback Natural UX Conversation snapshot when Pillow session is unavailable. */
export function collectNaturalUxConversationSnapshot() {
  const engine = buildOfflineNaturalUxConversationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalTurns: 0,
      clarificationsPending: 0,
      builderRequestsCount: 0,
      confidenceScore: 0,
      totalConversations: 0,
      recentLogs: [],
    },
    latestReport: null as ConversationRunReport | null,
  };
}
