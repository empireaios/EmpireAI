import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { appendCaptureLog, getCaptureLogs, resetCaptureLogsForTesting } from "./capture-logging.js";
import { CaptureController } from "./capture-controller.js";
import { buildVisualCaptureConfiguration, type VisualCaptureConfiguration } from "./configuration.js";
import { VISUAL_CAPTURE_SYSTEM_PATH } from "./paths.js";
import type {
  VisualCaptureCockpitSnapshot,
  VisualCaptureState,
  CaptureFrame,
} from "./types.js";

export interface VisualCaptureEngineOptions {
  configuration?: Partial<VisualCaptureConfiguration>;
  autoStart?: boolean;
}

/**
 * Visual Capture Engine (PILLOW-VCE-001 / T1-01).
 * Foundational live visual acquisition layer for Pillow.
 */
export class VisualCaptureEngine {
  private initializedAt: string | null = null;
  private readonly controller: CaptureController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: VisualCaptureEngineOptions = {},
  ) {
    const config = buildVisualCaptureConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CaptureController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  private autoStart: boolean;

  async initialize(): Promise<VisualCaptureState> {
    const doc = await this.reader.readText(VISUAL_CAPTURE_SYSTEM_PATH);
    if (!doc?.includes("Visual Capture")) {
      throw new Error(
        `${VISUAL_CAPTURE_SYSTEM_PATH} missing — Visual Capture Engine requires T1-01 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCaptureLog({ event: "session_start", level: "info", details: "Visual Capture Engine session initialized" });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): VisualCaptureState {
    if (!this.initializedAt) {
      throw new Error("Visual Capture Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getFrameBufferSize(),
    });

    return {
      engineVersion: "PILLOW-VCE-001",
      missionId: "T1-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      selectedWindow: this.controller.getSelectedWindow(),
      displays: this.controller.getDisplays(),
      latestFrame: this.controller.getLatestFrame(),
      health,
      performance,
    };
  }

  async startCapture(): Promise<VisualCaptureState> {
    await this.controller.start();
    return this.getState();
  }

  stopCapture(): VisualCaptureState {
    this.controller.stop();
    return this.getState();
  }

  pauseCapture(): VisualCaptureState {
    this.controller.pause();
    return this.getState();
  }

  resumeCapture(): VisualCaptureState {
    this.controller.resume();
    return this.getState();
  }

  getLatestFrame(): CaptureFrame | null {
    return this.controller.getLatestFrame();
  }

  getRecentFrames(limit = 5): CaptureFrame[] {
    return this.controller.getRecentFrames(limit);
  }

  updateConfiguration(overrides: Partial<VisualCaptureConfiguration>): VisualCaptureState {
    const next = buildVisualCaptureConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const score = state.health.healthScore;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Capture status: ${state.status}`,
        `Frames captured: ${state.performance.successfulFrames}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VisualCaptureCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestFrame;
    return {
      captureStatus: state.status,
      healthStatus: state.health.status,
      framesCaptured: state.performance.successfulFrames,
      latestFrameTimestamp: latest?.metadata.timestamp ?? null,
      viewportDimensions: latest
        ? `${latest.metadata.viewport.width}x${latest.metadata.viewport.height}`
        : "unknown",
      captureSource: state.configuration.captureSource,
      captureIntervalMs: state.configuration.captureIntervalMs,
      selectedWindowTitle: state.selectedWindow?.title ?? null,
      displayCount: state.displays.length,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getCaptureLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createVisualCaptureEngine(
  bootstrap: EmpireBootstrapContext,
  options?: VisualCaptureEngineOptions,
): VisualCaptureEngine {
  return new VisualCaptureEngine(bootstrap, options);
}

export function resetVisualCaptureEngineForTesting(): void {
  resetCaptureLogsForTesting();
}
