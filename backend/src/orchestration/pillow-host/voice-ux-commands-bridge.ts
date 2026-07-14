import { buildVoiceUxCommandsConfiguration } from "@empireai/pillow";
import type { VoiceUxCommandsState, VoiceCommandRunReport } from "@empireai/pillow";

function buildOfflineVoiceUxCommandsState(): VoiceUxCommandsState {
  const configuration = buildVoiceUxCommandsConfiguration();
  return {
    engineVersion: "PILLOW-VUC-001",
    missionId: "T4-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      voiceCommandsEnabled: configuration.enabled,
      commandsCompleted: 0,
      lastCommandAt: null,
      lastCommandDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      totalTranscriptions: 0,
      clarificationsRequested: 0,
      conversationLinksCreated: 0,
      averageCommandDurationMs: 0,
      peakCommandDurationMs: 0,
    },
  };
}

/** Fallback Voice UX Commands snapshot when Pillow session is unavailable. */
export function collectVoiceUxCommandsSnapshot() {
  const engine = buildOfflineVoiceUxCommandsState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalCommands: 0,
      clarificationsPending: 0,
      conversationLinks: 0,
      confidenceScore: 0,
      totalTranscriptions: 0,
      recentLogs: [],
    },
    latestReport: null as VoiceCommandRunReport | null,
  };
}
