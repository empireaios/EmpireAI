/** T1-02 — Mapping orchestration controller. */

import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { CaptureFrame } from "../visual-capture-engine/types.js";
import { appendMappingLog } from "./mapping-logging.js";
import { MappingScheduler } from "./mapping-scheduler.js";
import { StateMappingEngine } from "./state-mapping-engine.js";
import { StateBuffer } from "./state-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { UiStateManager } from "./ui-state-manager.js";
import type { UiStateMapperConfiguration } from "./configuration.js";
import type {
  MappingPerformanceStats,
  MappingStatus,
  UiStateModel,
} from "./types.js";

export class MappingController {
  private config: UiStateMapperConfiguration;
  private status: MappingStatus = "idle";
  private stateSequence = 0;
  private lastProcessedFrameNumber = 0;
  private performance: MappingPerformanceStats = {
    totalStates: 0,
    successfulStates: 0,
    failedStates: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedFrames: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new UiStateManager();
  private readonly mappingEngine = new StateMappingEngine();
  private readonly stateBuffer: StateBuffer;
  private readonly scheduler = new MappingScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private latestState: UiStateModel | null = null;
  private previousState: UiStateModel | null = null;
  private mapping = false;

  constructor(
    private visualCapture: VisualCaptureEngine,
    config: UiStateMapperConfiguration,
  ) {
    this.config = config;
    this.stateBuffer = new StateBuffer(config.stateBufferLimit);
  }

  getStatus(): MappingStatus {
    return this.status;
  }

  getConfiguration(): UiStateMapperConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: UiStateMapperConfiguration): void {
    this.config = config;
    this.stateBuffer.setLimit(config.stateBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendMappingLog({
      event: "engine_initialized",
      level: "info",
      details: "UI State Mapper initialized",
    });
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.status = "idle";
      return;
    }
    if (this.scheduler.isRunning()) return;

    this.sessionManager.startSession();
    this.healthMonitor.markSessionStart();
    this.recoveryManager.reset();
    this.stateSequence = 0;
    this.lastProcessedFrameNumber = 0;
    this.status = "mapping";

    appendMappingLog({
      event: "mapping_start",
      level: "info",
      details: "UI state mapping session started",
    });

    this.scheduler.start(this.config, () => this.mappingTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendMappingLog({ event: "mapping_stop", level: "info", details: "Mapping stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendMappingLog({ event: "mapping_pause", level: "info", details: "Mapping paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("mapping");
    this.status = "mapping";
    appendMappingLog({ event: "mapping_resume", level: "info", details: "Mapping resumed" });
  }

  getLatestState(): UiStateModel | null {
    return this.latestState;
  }

  getPreviousState(): UiStateModel | null {
    return this.previousState;
  }

  getRecentStates(limit = 5): UiStateModel[] {
    return this.stateBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): MappingPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getStateBufferSize(): number {
    return this.stateBuffer.size();
  }

  /** Process a single frame directly (for tests and manual mapping). */
  processFrame(frame: CaptureFrame): UiStateModel | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `usm-direct-${Date.now()}`;
    this.stateSequence += 1;
    const result = this.mappingEngine.mapFrame({
      frame,
      sessionId,
      stateSequence: this.stateSequence,
      previousState: this.previousState,
      config: this.config,
    });
    if (result.state) {
      this.previousState = this.latestState;
      this.latestState = result.state;
      this.stateBuffer.push(result.state);
      this.sessionManager.recordState(true, frame.metadata.frameNumber);
      return result.state;
    }
    return null;
  }

  private async mappingTick(): Promise<void> {
    if (this.mapping) {
      this.performance.skippedFrames += 1;
      return;
    }
    this.mapping = true;
    try {
      const frame = this.visualCapture.getLatestFrame();
      const session = this.sessionManager.getSession();

      if (!session) {
        this.status = "failed";
        return;
      }

      if (!frame) {
        this.performance.skippedFrames += 1;
        appendMappingLog({
          event: "missing_frame",
          level: "warn",
          details: "No frame available from Visual Capture Engine",
        });
        const shouldRecover = this.recoveryManager.recordFailure("Missing frame", this.config);
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "mapping";
        }
        return;
      }

      if (frame.metadata.frameNumber <= this.lastProcessedFrameNumber) {
        return;
      }

      this.stateSequence += 1;
      const result = this.mappingEngine.mapFrame({
        frame,
        sessionId: session.sessionId,
        stateSequence: this.stateSequence,
        previousState: this.previousState,
        config: this.config,
      });

      this.performance.totalStates += 1;

      if (result.state) {
        this.previousState = this.latestState;
        this.latestState = result.state;
        this.stateBuffer.push(result.state);
        this.sessionManager.recordState(true, frame.metadata.frameNumber);
        this.lastProcessedFrameNumber = frame.metadata.frameNumber;
        this.recoveryManager.recordSuccess();
        this.performance.successfulStates += 1;

        const duration = result.state.metadata.processingDurationMs;
        this.healthMonitor.recordMapping(duration, true);
        this.performance.peakProcessingDurationMs = Math.max(
          this.performance.peakProcessingDurationMs,
          duration,
        );
        this.performance.averageProcessingDurationMs = Math.round(
          (this.performance.averageProcessingDurationMs * (this.performance.successfulStates - 1) +
            duration) /
            this.performance.successfulStates,
        );

        appendMappingLog({
          event: "state_generated",
          level: "info",
          details: `State ${result.state.metadata.stateId} · ${result.state.screen.regions.length} regions · changes=${result.state.changeSummary?.hasChanges ?? false}`,
        });

        if (result.state.changeSummary?.hasChanges) {
          appendMappingLog({
            event: "state_update",
            level: "info",
            details: `appeared=${result.state.changeSummary.appeared.length} disappeared=${result.state.changeSummary.disappeared.length} modified=${result.state.changeSummary.modified.length}`,
          });
        }

        this.status = "mapping";
      } else {
        this.sessionManager.recordState(false, frame.metadata.frameNumber);
        this.performance.failedStates += 1;
        this.healthMonitor.recordMapping(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown mapping error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "mapping";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendMappingLog({
            event: "mapping_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.mapping = false;
    }
  }
}
