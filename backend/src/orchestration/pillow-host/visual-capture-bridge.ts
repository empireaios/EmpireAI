import { buildVisualCaptureConfiguration } from "@empireai/pillow";
import type { VisualCaptureState, CaptureFrame } from "@empireai/pillow";

function buildOfflineVisualCaptureState(): VisualCaptureState {
  const configuration = buildVisualCaptureConfiguration();
  return {
    engineVersion: "PILLOW-VCE-001",
    missionId: "T1-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    selectedWindow: null,
    displays: [],
    latestFrame: null,
    health: {
      status: "standby",
      healthScore: 50,
      captureEnabled: configuration.enabled,
      isCapturing: false,
      lastSuccessfulCaptureAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageCaptureDurationMs: 0,
      framesPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalFrames: 0,
      successfulFrames: 0,
      failedFrames: 0,
      averageCaptureDurationMs: 0,
      peakCaptureDurationMs: 0,
      droppedFrames: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Visual Capture snapshot when Pillow session is unavailable. */
export function collectVisualCaptureSnapshot() {
  const engine = buildOfflineVisualCaptureState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-01",
    live: false,
    engine,
    cockpit: {
      captureStatus: engine.status,
      healthStatus: engine.health.status,
      framesCaptured: 0,
      latestFrameTimestamp: null,
      viewportDimensions: "unknown",
      captureSource: engine.configuration.captureSource,
      captureIntervalMs: engine.configuration.captureIntervalMs,
      selectedWindowTitle: null,
      displayCount: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestFrame: null as CaptureFrame | null,
  };
}
