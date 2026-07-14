import { buildVisualMemoryConfiguration } from "@empireai/pillow";
import type { VisualMemoryState, VisualMemoryRecord } from "@empireai/pillow";

function buildOfflineVisualMemoryState(): VisualMemoryState {
  const configuration = buildVisualMemoryConfiguration();
  return {
    engineVersion: "PILLOW-VME-001",
    missionId: "T1-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      memoryEnabled: configuration.enabled,
      isRecording: false,
      lastSuccessfulRecordAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageStorageDurationMs: 0,
      recordsPerMinute: 0,
      backlogSize: 0,
      totalStoredRecords: 0,
      storageUsedBytes: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      maskedSensitiveFields: 0,
      retrievals: 0,
      comparisons: 0,
      cleanups: 0,
      averageStorageDurationMs: 0,
      peakStorageDurationMs: 0,
      skippedCaptures: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Visual Memory snapshot when Pillow session is unavailable. */
export function collectVisualMemorySnapshot() {
  const engine = buildOfflineVisualMemoryState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-08",
    live: false,
    engine,
    cockpit: {
      memoryStatus: engine.status,
      healthStatus: engine.health.status,
      recordsStored: 0,
      latestScreenId: null,
      latestWorkflowContextId: null,
      storageUsedBytes: 0,
      retentionCategory: null,
      confidenceScore: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestRecord: null as VisualMemoryRecord | null,
    recentRecords: [] as VisualMemoryRecord[],
  };
}
