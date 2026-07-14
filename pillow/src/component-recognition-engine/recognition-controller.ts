/** T1-03 — Recognition orchestration controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { UiStateModel } from "../ui-state-mapper/types.js";
import { appendRecognitionLog } from "./recognition-logging.js";
import { RecognitionScheduler } from "./recognition-scheduler.js";
import { ComponentDetectionEngine } from "./component-detection-engine.js";
import { ResultBuffer } from "./result-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ComponentRecognitionManager } from "./component-recognition-manager.js";
import type { ComponentRecognitionConfiguration } from "./configuration.js";
import type {
  ComponentRecognitionResult,
  RecognitionPerformanceStats,
  RecognitionStatus,
} from "./types.js";

export class RecognitionController {
  private config: ComponentRecognitionConfiguration;
  private status: RecognitionStatus = "idle";
  private recognitionSequence = 0;
  private lastProcessedStateId = "";
  private performance: RecognitionPerformanceStats = {
    totalRecognitions: 0,
    successfulRecognitions: 0,
    failedRecognitions: 0,
    totalComponentsDetected: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedStates: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new ComponentRecognitionManager();
  private readonly detectionEngine = new ComponentDetectionEngine();
  private readonly resultBuffer: ResultBuffer;
  private readonly scheduler = new RecognitionScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private latestResult: ComponentRecognitionResult | null = null;
  private previousResult: ComponentRecognitionResult | null = null;
  private recognizing = false;

  constructor(
    private uiStateMapper: UiStateMapperEngine,
    config: ComponentRecognitionConfiguration,
  ) {
    this.config = config;
    this.resultBuffer = new ResultBuffer(config.resultBufferLimit);
  }

  getStatus(): RecognitionStatus {
    return this.status;
  }

  getConfiguration(): ComponentRecognitionConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ComponentRecognitionConfiguration): void {
    this.config = config;
    this.resultBuffer.setLimit(config.resultBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendRecognitionLog({
      event: "engine_initialized",
      level: "info",
      details: "Component Recognition Engine initialized",
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
    this.recognitionSequence = 0;
    this.lastProcessedStateId = "";
    this.status = "recognizing";

    appendRecognitionLog({
      event: "recognition_start",
      level: "info",
      details: "Component recognition session started",
    });

    this.scheduler.start(this.config, () => this.recognitionTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendRecognitionLog({ event: "recognition_stop", level: "info", details: "Recognition stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendRecognitionLog({ event: "recognition_pause", level: "info", details: "Recognition paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("recognizing");
    this.status = "recognizing";
    appendRecognitionLog({ event: "recognition_resume", level: "info", details: "Recognition resumed" });
  }

  getLatestResult(): ComponentRecognitionResult | null {
    return this.latestResult;
  }

  getPreviousResult(): ComponentRecognitionResult | null {
    return this.previousResult;
  }

  getRecentResults(limit = 5): ComponentRecognitionResult[] {
    return this.resultBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): RecognitionPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getResultBufferSize(): number {
    return this.resultBuffer.size();
  }

  /** Process a single UI state directly (for tests and manual recognition). */
  recognizeUiState(uiState: UiStateModel): ComponentRecognitionResult | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `cre-direct-${Date.now()}`;
    this.recognitionSequence += 1;
    const result = this.detectionEngine.detect({
      uiState,
      sessionId,
      recognitionSequence: this.recognitionSequence,
      previousResult: this.previousResult,
      config: this.config,
    });
    if (result.result) {
      this.applyResult(result.result, uiState.metadata.stateId);
      return result.result;
    }
    return null;
  }

  private applyResult(result: ComponentRecognitionResult, sourceStateId: string): void {
    this.previousResult = this.latestResult;
    this.latestResult = result;
    this.resultBuffer.push(result);
    this.sessionManager.recordRecognition(true, sourceStateId);
    this.recoveryManager.recordSuccess();
    this.performance.successfulRecognitions += 1;
    this.performance.totalComponentsDetected += result.components.length;
    const duration = result.metadata.processingDurationMs;
    this.healthMonitor.recordRecognition(duration, true);
    this.performance.peakProcessingDurationMs = Math.max(
      this.performance.peakProcessingDurationMs,
      duration,
    );
    this.performance.averageProcessingDurationMs = Math.round(
      (this.performance.averageProcessingDurationMs * (this.performance.successfulRecognitions - 1) +
        duration) /
        this.performance.successfulRecognitions,
    );
  }

  private async recognitionTick(): Promise<void> {
    if (this.recognizing) {
      this.performance.skippedStates += 1;
      return;
    }
    this.recognizing = true;
    try {
      const uiState = this.uiStateMapper.getLatestState();
      const session = this.sessionManager.getSession();

      if (!session) {
        this.status = "failed";
        return;
      }

      if (!uiState) {
        this.performance.skippedStates += 1;
        appendRecognitionLog({
          event: "missing_ui_state",
          level: "warn",
          details: "No UI state available from UI State Mapper",
        });
        const shouldRecover = this.recoveryManager.recordFailure("Missing UI state", this.config);
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "recognizing";
        }
        return;
      }

      if (uiState.metadata.stateId === this.lastProcessedStateId) {
        return;
      }

      this.recognitionSequence += 1;
      this.performance.totalRecognitions += 1;

      const result = this.detectionEngine.detect({
        uiState,
        sessionId: session.sessionId,
        recognitionSequence: this.recognitionSequence,
        previousResult: this.previousResult,
        config: this.config,
      });

      if (result.result) {
        this.applyResult(result.result, uiState.metadata.stateId);
        this.lastProcessedStateId = uiState.metadata.stateId;

        appendRecognitionLog({
          event: "component_detection",
          level: "info",
          details: `Detected ${result.result.components.length} components in ${result.result.metadata.recognitionId}`,
        });

        if (result.result.changeSummary?.hasChanges) {
          appendRecognitionLog({
            event: "component_change",
            level: "info",
            details: `appeared=${result.result.changeSummary.appeared.length} disappeared=${result.result.changeSummary.disappeared.length} changed=${result.result.changeSummary.changed.length}`,
          });
        }

        this.status = "recognizing";
      } else {
        this.sessionManager.recordRecognition(false, uiState.metadata.stateId);
        this.performance.failedRecognitions += 1;
        this.healthMonitor.recordRecognition(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown recognition error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "recognizing";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendRecognitionLog({
            event: "recognition_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.recognizing = false;
    }
  }
}
