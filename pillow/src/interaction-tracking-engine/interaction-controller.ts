/** T1-06 — Interaction tracking orchestration controller. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import { appendInteractionLog } from "./interaction-logging.js";
import { TrackingScheduler } from "./tracking-scheduler.js";
import { InteractionAnalysisEngine } from "./interaction-analysis-engine.js";
import { EventBuffer } from "./event-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { InteractionTrackingManager } from "./interaction-tracking-manager.js";
import type { InteractionTrackingConfiguration } from "./configuration.js";
import type {
  InteractionEvent,
  InteractionPerformanceStats,
  RawInteractionInput,
  TrackingStatus,
} from "./types.js";

export class InteractionController {
  private config: InteractionTrackingConfiguration;
  private status: TrackingStatus = "idle";
  private lastProcessedGraphId = "";
  private performance: InteractionPerformanceStats = {
    totalEvents: 0,
    successfulEvents: 0,
    failedEvents: 0,
    inferredEvents: 0,
    ingestedEvents: 0,
    maskedSensitiveEvents: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedPolls: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new InteractionTrackingManager();
  private readonly analysisEngine = new InteractionAnalysisEngine();
  private readonly eventBuffer: EventBuffer;
  private readonly scheduler = new TrackingScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private tracking = false;

  constructor(
    private navigationMapping: NavigationMappingEngine,
    private layoutUnderstanding: LayoutUnderstandingEngine,
    private componentRecognition: ComponentRecognitionEngine,
    config: InteractionTrackingConfiguration,
  ) {
    this.config = config;
    this.eventBuffer = new EventBuffer(config.eventBufferLimit);
  }

  getStatus(): TrackingStatus {
    return this.status;
  }

  getConfiguration(): InteractionTrackingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: InteractionTrackingConfiguration): void {
    this.config = config;
    this.eventBuffer.setLimit(config.eventBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    appendInteractionLog({
      event: "engine_initialized",
      level: "info",
      details: "Interaction Tracking Engine initialized",
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
    this.analysisEngine.reset();
    this.analysisEngine.getListener().attach();
    this.lastProcessedGraphId = "";
    this.status = "tracking";

    appendInteractionLog({
      event: "interaction_start",
      level: "info",
      details: "Interaction tracking session started",
    });

    this.scheduler.start(this.config, () => this.trackingTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.analysisEngine.getListener().detach();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendInteractionLog({ event: "interaction_stop", level: "info", details: "Interaction tracking stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendInteractionLog({ event: "interaction_pause", level: "info", details: "Interaction tracking paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("tracking");
    this.status = "tracking";
    appendInteractionLog({ event: "interaction_resume", level: "info", details: "Interaction tracking resumed" });
  }

  getRecentEvents(limit = 20): InteractionEvent[] {
    return this.eventBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): InteractionPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getEventBufferSize(): number {
    return this.eventBuffer.size();
  }

  recordInteraction(raw: RawInteractionInput): InteractionEvent | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `ite-direct-${Date.now()}`;
    this.analysisEngine.getListener().enqueue(raw);
    const event = this.analysisEngine.recordRaw({
      raw,
      sessionId,
      config: this.config,
      navigationMapping: this.navigationMapping,
      layoutUnderstanding: this.layoutUnderstanding,
      componentRecognition: this.componentRecognition,
    });
    if (event) this.applyEvent(event, "ingested");
    return event;
  }

  private applyEvent(event: InteractionEvent, source: "ingested" | "inferred"): void {
    this.eventBuffer.push(event);
    this.sessionManager.recordEvent(true);
    this.recoveryManager.recordSuccess();
    this.performance.successfulEvents += 1;
    this.performance.totalEvents += 1;
    if (source === "ingested") this.performance.ingestedEvents += 1;
    else this.performance.inferredEvents += 1;
    if (event.inputChange?.masked) this.performance.maskedSensitiveEvents += 1;
    this.healthMonitor.recordEvent(1, true);
  }

  private async trackingTick(): Promise<void> {
    if (this.tracking) {
      this.performance.skippedPolls += 1;
      return;
    }
    this.tracking = true;
    try {
      const session = this.sessionManager.getSession();
      if (!session) {
        this.status = "failed";
        return;
      }

      const result = this.analysisEngine.analyzeTick({
        sessionId: session.sessionId,
        config: this.config,
        navigationMapping: this.navigationMapping,
        layoutUnderstanding: this.layoutUnderstanding,
        componentRecognition: this.componentRecognition,
        previousGraphId: this.lastProcessedGraphId,
      });

      for (const event of result.events) {
        const source = event.eventId.includes("direct") ? "ingested" : "inferred";
        this.applyEvent(event, source);
        appendInteractionLog({
          event: "interaction_recorded",
          level: "info",
          details: `${event.interactionType} on ${event.sourceComponentId ?? "unknown"}`,
        });
      }

      const graph = this.navigationMapping.getLatestGraph();
      if (graph) this.lastProcessedGraphId = graph.metadata.graphId;

      if (result.errors.length > 0) {
        const shouldRecover = this.recoveryManager.recordFailure(
          result.errors.join("; "),
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "tracking";
        }
      } else {
        this.status = "tracking";
      }
    } finally {
      this.tracking = false;
    }
  }
}
