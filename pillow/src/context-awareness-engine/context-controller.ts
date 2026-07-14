/** T1-07 — Context awareness orchestration controller. */

import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import { appendContextLog } from "./context-logging.js";
import { ContextScheduler } from "./context-scheduler.js";
import { ContextAnalysisEngine } from "./context-analysis-engine.js";
import { ContextBuffer } from "./context-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ContextAwarenessManager } from "./context-awareness-manager.js";
import type { ContextAwarenessConfiguration } from "./configuration.js";
import type {
  AwarenessStatus,
  ContextPerformanceStats,
  WorkflowContextModel,
} from "./types.js";

export class ContextController {
  private config: ContextAwarenessConfiguration;
  private status: AwarenessStatus = "idle";
  private contextSequence = 0;
  private lastContextFingerprint = "";
  private performance: ContextPerformanceStats = {
    totalContexts: 0,
    successfulContexts: 0,
    failedContexts: 0,
    contextChanges: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedUpdates: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new ContextAwarenessManager();
  private readonly analysisEngine = new ContextAnalysisEngine();
  private readonly contextBuffer: ContextBuffer;
  private readonly scheduler = new ContextScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  private latestContext: WorkflowContextModel | null = null;
  private previousContext: WorkflowContextModel | null = null;
  private analyzing = false;

  constructor(
    private interactionTracking: InteractionTrackingEngine,
    private navigationMapping: NavigationMappingEngine,
    private layoutUnderstanding: LayoutUnderstandingEngine,
    private componentRecognition: ComponentRecognitionEngine,
    config: ContextAwarenessConfiguration,
  ) {
    this.config = config;
    this.contextBuffer = new ContextBuffer(config.contextBufferLimit);
  }

  getStatus(): AwarenessStatus {
    return this.status;
  }

  getConfiguration(): ContextAwarenessConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ContextAwarenessConfiguration): void {
    this.config = config;
    this.contextBuffer.setLimit(config.contextBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendContextLog({
      event: "engine_initialized",
      level: "info",
      details: "Context Awareness Engine initialized",
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
    this.contextSequence = 0;
    this.lastContextFingerprint = "";
    this.status = "aware";

    appendContextLog({
      event: "context_start",
      level: "info",
      details: "Context awareness session started",
    });

    this.scheduler.start(this.config, () => this.contextTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendContextLog({ event: "context_stop", level: "info", details: "Context awareness stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendContextLog({ event: "context_pause", level: "info", details: "Context awareness paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("aware");
    this.status = "aware";
    appendContextLog({ event: "context_resume", level: "info", details: "Context awareness resumed" });
  }

  getLatestContext(): WorkflowContextModel | null {
    return this.latestContext;
  }

  getPreviousContext(): WorkflowContextModel | null {
    return this.previousContext;
  }

  getRecentContexts(limit = 5): WorkflowContextModel[] {
    return this.contextBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): ContextPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getContextBufferSize(): number {
    return this.contextBuffer.size();
  }

  analyzeNow(): WorkflowContextModel | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `cae-direct-${Date.now()}`;
    this.contextSequence += 1;
    const result = this.analysisEngine.analyze({
      sessionId,
      contextSequence: this.contextSequence,
      config: this.config,
      interactionTracking: this.interactionTracking,
      navigationMapping: this.navigationMapping,
      layoutUnderstanding: this.layoutUnderstanding,
      componentRecognition: this.componentRecognition,
      previousContext: this.previousContext,
    });
    if (result.context) {
      this.applyContext(result.context, result.changeSummary?.hasChanges ?? false);
      return result.context;
    }
    return null;
  }

  private applyContext(context: WorkflowContextModel, changed: boolean): void {
    this.previousContext = this.latestContext;
    this.latestContext = context;
    this.contextBuffer.push(context);
    this.sessionManager.recordContext(true, context.currentScreenId);
    this.recoveryManager.recordSuccess();
    this.performance.successfulContexts += 1;
    this.performance.totalContexts += 1;
    if (changed) this.performance.contextChanges += 1;
    this.healthMonitor.recordContext(1, true);
  }

  private fingerprint(): string {
    const events = this.interactionTracking.getRecentEvents(3);
    const graph = this.navigationMapping.getLatestGraph();
    const layout = this.layoutUnderstanding.getLatestLayout();
    return [
      graph?.metadata.graphId ?? "",
      layout?.metadata.layoutId ?? "",
      events.map((e) => e.eventId).join(","),
    ].join("|");
  }

  private async contextTick(): Promise<void> {
    if (this.analyzing) {
      this.performance.skippedUpdates += 1;
      return;
    }
    this.analyzing = true;
    try {
      const session = this.sessionManager.getSession();
      if (!session) {
        this.status = "failed";
        return;
      }

      const fp = this.fingerprint();
      if (fp === this.lastContextFingerprint && fp !== "") {
        return;
      }

      this.contextSequence += 1;
      const result = this.analysisEngine.analyze({
        sessionId: session.sessionId,
        contextSequence: this.contextSequence,
        config: this.config,
        interactionTracking: this.interactionTracking,
        navigationMapping: this.navigationMapping,
        layoutUnderstanding: this.layoutUnderstanding,
        componentRecognition: this.componentRecognition,
        previousContext: this.previousContext,
      });

      if (result.context) {
        this.applyContext(result.context, result.changeSummary?.hasChanges ?? false);
        this.lastContextFingerprint = fp;
        this.status = "aware";
      } else {
        this.sessionManager.recordContext(false, null);
        this.performance.failedContexts += 1;
        this.healthMonitor.recordContext(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown context error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "aware";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendContextLog({
            event: "context_failed",
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
