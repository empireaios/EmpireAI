/** T1-04 — Layout orchestration controller. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import { appendLayoutLog } from "./layout-logging.js";
import { LayoutScheduler } from "./layout-scheduler.js";
import { LayoutAnalysisEngine } from "./layout-analysis-engine.js";
import { LayoutBuffer } from "./layout-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { LayoutUnderstandingManager } from "./layout-understanding-manager.js";
import type { LayoutUnderstandingConfiguration } from "./configuration.js";
import type {
  LayoutModel,
  LayoutPerformanceStats,
  LayoutStatus,
} from "./types.js";

export class LayoutController {
  private config: LayoutUnderstandingConfiguration;
  private status: LayoutStatus = "idle";
  private layoutSequence = 0;
  private lastProcessedRecognitionId = "";
  private performance: LayoutPerformanceStats = {
    totalLayouts: 0,
    successfulLayouts: 0,
    failedLayouts: 0,
    totalRegionsDetected: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedRecognitions: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new LayoutUnderstandingManager();
  private readonly analysisEngine = new LayoutAnalysisEngine();
  private readonly layoutBuffer: LayoutBuffer;
  private readonly scheduler = new LayoutScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private latestLayout: LayoutModel | null = null;
  private previousLayout: LayoutModel | null = null;
  private analyzing = false;

  constructor(
    private componentRecognition: ComponentRecognitionEngine,
    config: LayoutUnderstandingConfiguration,
  ) {
    this.config = config;
    this.layoutBuffer = new LayoutBuffer(config.layoutBufferLimit);
  }

  getStatus(): LayoutStatus {
    return this.status;
  }

  getConfiguration(): LayoutUnderstandingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LayoutUnderstandingConfiguration): void {
    this.config = config;
    this.layoutBuffer.setLimit(config.layoutBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendLayoutLog({
      event: "engine_initialized",
      level: "info",
      details: "Layout Understanding Engine initialized",
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
    this.layoutSequence = 0;
    this.lastProcessedRecognitionId = "";
    this.status = "analyzing";

    appendLayoutLog({
      event: "layout_start",
      level: "info",
      details: "Layout understanding session started",
    });

    this.scheduler.start(this.config, () => this.analysisTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendLayoutLog({ event: "layout_stop", level: "info", details: "Layout analysis stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendLayoutLog({ event: "layout_pause", level: "info", details: "Layout analysis paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("analyzing");
    this.status = "analyzing";
    appendLayoutLog({ event: "layout_resume", level: "info", details: "Layout analysis resumed" });
  }

  getLatestLayout(): LayoutModel | null {
    return this.latestLayout;
  }

  getPreviousLayout(): LayoutModel | null {
    return this.previousLayout;
  }

  getRecentLayouts(limit = 5): LayoutModel[] {
    return this.layoutBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): LayoutPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getLayoutBufferSize(): number {
    return this.layoutBuffer.size();
  }

  analyzeRecognition(recognition: ComponentRecognitionResult): LayoutModel | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `lue-direct-${Date.now()}`;
    this.layoutSequence += 1;
    const result = this.analysisEngine.analyze({
      recognition,
      sessionId,
      layoutSequence: this.layoutSequence,
      previousLayout: this.previousLayout,
      config: this.config,
    });
    if (result.layout) {
      this.applyLayout(result.layout, recognition.metadata.sourceStateId);
      return result.layout;
    }
    return null;
  }

  private applyLayout(layout: LayoutModel, sourceStateId: string): void {
    this.previousLayout = this.latestLayout;
    this.latestLayout = layout;
    this.layoutBuffer.push(layout);
    this.sessionManager.recordLayout(true, sourceStateId);
    this.recoveryManager.recordSuccess();
    this.performance.successfulLayouts += 1;
    this.performance.totalRegionsDetected += layout.regions.length;
    const duration = layout.metadata.processingDurationMs;
    this.healthMonitor.recordLayout(duration, true);
    this.performance.peakProcessingDurationMs = Math.max(
      this.performance.peakProcessingDurationMs,
      duration,
    );
    this.performance.averageProcessingDurationMs = Math.round(
      (this.performance.averageProcessingDurationMs * (this.performance.successfulLayouts - 1) +
        duration) /
        this.performance.successfulLayouts,
    );
  }

  private async analysisTick(): Promise<void> {
    if (this.analyzing) {
      this.performance.skippedRecognitions += 1;
      return;
    }
    this.analyzing = true;
    try {
      const recognition = this.componentRecognition.getLatestResult();
      const session = this.sessionManager.getSession();

      if (!session) {
        this.status = "failed";
        return;
      }

      if (!recognition) {
        this.performance.skippedRecognitions += 1;
        appendLayoutLog({
          event: "missing_recognition",
          level: "warn",
          details: "No component recognition result available",
        });
        const shouldRecover = this.recoveryManager.recordFailure(
          "Missing component recognition",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "analyzing";
        }
        return;
      }

      if (recognition.metadata.recognitionId === this.lastProcessedRecognitionId) {
        return;
      }

      this.layoutSequence += 1;
      this.performance.totalLayouts += 1;

      const result = this.analysisEngine.analyze({
        recognition,
        sessionId: session.sessionId,
        layoutSequence: this.layoutSequence,
        previousLayout: this.previousLayout,
        config: this.config,
      });

      if (result.layout) {
        this.applyLayout(result.layout, recognition.metadata.sourceStateId);
        this.lastProcessedRecognitionId = recognition.metadata.recognitionId;

        appendLayoutLog({
          event: "layout_analysis",
          level: "info",
          details: `Layout ${result.layout.metadata.layoutId} · ${result.layout.regions.length} regions · confidence ${result.layout.metadata.confidenceScore}`,
        });

        if (result.layout.changeSummary?.hasChanges) {
          appendLayoutLog({
            event: "layout_change",
            level: "info",
            details: `appeared=${result.layout.changeSummary.regionsAppeared.length} disappeared=${result.layout.changeSummary.regionsDisappeared.length} modified=${result.layout.changeSummary.regionsModified.length}`,
          });
        }

        this.status = "analyzing";
      } else {
        this.sessionManager.recordLayout(false, recognition.metadata.sourceStateId);
        this.performance.failedLayouts += 1;
        this.healthMonitor.recordLayout(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown layout error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "analyzing";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendLayoutLog({
            event: "layout_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.analyzing = false;
    }
  }
}
