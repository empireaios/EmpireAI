/** T1-09 — Session continuity orchestration controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import { appendContinuityLog } from "./continuity-logging.js";
import { ContinuityScheduler } from "./continuity-scheduler.js";
import { ContinuityBuffer } from "./continuity-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SessionContinuityManager } from "./session-continuity-manager.js";
import { ContinuityAnalysisEngine } from "./continuity-analysis-engine.js";
import { SessionContextStore } from "./session-context-store.js";
import { SessionIdentityEngine } from "./session-identity-engine.js";
import type { SessionContinuityConfiguration } from "./configuration.js";
import type {
  ContinuityPerformanceStats,
  ContinuityStatus,
  SessionContinuityModel,
} from "./types.js";

export class ContinuityController {
  private config: SessionContinuityConfiguration;
  private status: ContinuityStatus = "idle";
  private continuitySequence = 0;
  private lastContinuityFingerprint = "";
  private stableStateCount = 0;
  private actorIdentifier: string | null = null;
  private performance: ContinuityPerformanceStats = {
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    interruptionsDetected: 0,
    recoveriesCompleted: 0,
    rehydrations: 0,
    stableStatesDetected: 0,
    averageProcessingDurationMs: 0,
    peakProcessingDurationMs: 0,
    skippedUpdates: 0,
    uptimeMs: 0,
  };

  private readonly sessionManager = new SessionContinuityManager();
  private readonly analysisEngine = new ContinuityAnalysisEngine();
  private readonly continuityBuffer: ContinuityBuffer;
  private readonly scheduler = new ContinuityScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly contextStore: SessionContextStore;
  private readonly identityEngine = new SessionIdentityEngine();

  private latestContinuity: SessionContinuityModel | null = null;
  private previousContinuity: SessionContinuityModel | null = null;
  private analyzing = false;

  constructor(
    private repositoryRoot: string,
    private uiStateMapper: UiStateMapperEngine,
    private layoutUnderstanding: LayoutUnderstandingEngine,
    private navigationMapping: NavigationMappingEngine,
    private interactionTracking: InteractionTrackingEngine,
    private contextAwareness: ContextAwarenessEngine,
    private visualMemory: VisualMemoryEngine,
    config: SessionContinuityConfiguration,
  ) {
    this.config = config;
    this.continuityBuffer = new ContinuityBuffer(config.continuityBufferLimit);
    this.contextStore = new SessionContextStore(repositoryRoot, config);
  }

  getStatus(): ContinuityStatus {
    return this.status;
  }

  getConfiguration(): SessionContinuityConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SessionContinuityConfiguration): void {
    this.config = config;
    this.continuityBuffer.setLimit(config.continuityBufferLimit);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    const persisted = this.contextStore.initialize();
    if (persisted) {
      this.contextStore.markRestartDetected();
      appendContinuityLog({
        event: "application_restart",
        level: "info",
        details: `Restart detected — prior session ${persisted.sessionId}`,
      });
    }
    appendContinuityLog({
      event: "engine_initialized",
      level: "info",
      details: "Session Continuity Engine initialized",
    });
  }

  async start(actorIdentifier?: string | null): Promise<void> {
    if (!this.config.enabled) {
      this.status = "idle";
      return;
    }
    if (this.scheduler.isRunning()) return;

    this.actorIdentifier = actorIdentifier ?? null;
    const runtimeId = `sce-runtime-${Date.now()}`;
    const identity = this.identityEngine.resolve({
      persisted: this.contextStore.getSnapshot(),
      runtimeSessionId: runtimeId,
      actorIdentifier: this.actorIdentifier,
    });

    const session = this.sessionManager.startSession(identity.sessionId);
    if (identity.isResumed) {
      this.sessionManager.recordEvent("session_resume");
      appendContinuityLog({
        event: "session_resume",
        level: "info",
        details: `Resumed session ${identity.sessionId}`,
      });
    } else {
      appendContinuityLog({
        event: "session_start",
        level: "info",
        details: `Started session ${session.sessionId}`,
      });
    }

    this.healthMonitor.markSessionStart();
    this.recoveryManager.reset();
    this.continuitySequence = 0;
    this.lastContinuityFingerprint = "";
    this.stableStateCount = 0;
    this.status = "active";

    this.scheduler.start(this.config, () => this.continuityTick());
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendContinuityLog({ event: "session_end", level: "info", details: "Session continuity stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.sessionManager.recordEvent("session_pause");
    this.status = "paused";
    appendContinuityLog({ event: "session_pause", level: "info", details: "Session continuity paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("active");
    this.sessionManager.recordEvent("session_resume");
    this.status = "active";
    appendContinuityLog({ event: "session_resume", level: "info", details: "Session continuity resumed" });
  }

  getLatestContinuity(): SessionContinuityModel | null {
    return this.latestContinuity;
  }

  getPreviousContinuity(): SessionContinuityModel | null {
    return this.previousContinuity;
  }

  getRecentContinuity(limit = 5): SessionContinuityModel[] {
    return this.continuityBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): ContinuityPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getContinuityBufferSize(): number {
    return this.continuityBuffer.size();
  }

  updateNow(): SessionContinuityModel | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `sce-direct-${Date.now()}`;
    this.continuitySequence += 1;
    const result = this.analysisEngine.analyze({
      sessionId,
      actorIdentifier: this.actorIdentifier,
      continuitySequence: this.continuitySequence,
      config: this.config,
      uiStateMapper: this.uiStateMapper,
      layoutUnderstanding: this.layoutUnderstanding,
      navigationMapping: this.navigationMapping,
      interactionTracking: this.interactionTracking,
      contextAwareness: this.contextAwareness,
      visualMemory: this.visualMemory,
      store: this.contextStore,
      previousContinuity: this.previousContinuity,
      stableStateCount: this.stableStateCount,
    });
    if (result.model) {
      this.applyContinuity(result.model, result.changeSummary, result.stableStateDetected);
      return result.model;
    }
    return null;
  }

  private applyContinuity(
    model: SessionContinuityModel,
    changes: import("./types.js").SessionChangeSummary | null,
    stableDetected: boolean,
  ): void {
    this.previousContinuity = this.latestContinuity;
    this.latestContinuity = model;
    this.continuityBuffer.push(model);
    this.contextStore.save(model, this.actorIdentifier);
    this.sessionManager.recordUpdate(true, model.currentScreenId);
    this.recoveryManager.recordSuccess();
    this.performance.successfulUpdates += 1;
    this.performance.totalUpdates += 1;
    if (changes?.interruptionDetected) {
      this.performance.interruptionsDetected += 1;
      this.status = "interrupted";
    } else {
      this.status = "active";
    }
    if (model.recoveryStatus === "completed" || model.recoveryStatus === "partial") {
      this.performance.recoveriesCompleted += 1;
      this.performance.rehydrations += 1;
    }
    if (stableDetected) {
      this.performance.stableStatesDetected += 1;
      this.stableStateCount += 1;
    } else {
      this.stableStateCount = 0;
    }
    this.healthMonitor.recordUpdate(1, true);
  }

  private fingerprint(): string {
    const uiState = this.uiStateMapper.getLatestState();
    const workflow = this.contextAwareness.getLatestContext();
    const memory = this.visualMemory.getLatestRecord();
    const events = this.interactionTracking.getRecentEvents(3);
    return [
      uiState?.metadata.stateId ?? "",
      workflow?.contextId ?? "",
      memory?.memoryRecordId ?? "",
      events.map((e) => e.eventId).join(","),
    ].join("|");
  }

  private async continuityTick(): Promise<void> {
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
      if (fp === this.lastContinuityFingerprint && fp !== "") {
        return;
      }

      this.continuitySequence += 1;
      const result = this.analysisEngine.analyze({
        sessionId: session.sessionId,
        actorIdentifier: this.actorIdentifier,
        continuitySequence: this.continuitySequence,
        config: this.config,
        uiStateMapper: this.uiStateMapper,
        layoutUnderstanding: this.layoutUnderstanding,
        navigationMapping: this.navigationMapping,
        interactionTracking: this.interactionTracking,
        contextAwareness: this.contextAwareness,
        visualMemory: this.visualMemory,
        store: this.contextStore,
        previousContinuity: this.previousContinuity,
        stableStateCount: this.stableStateCount,
      });

      if (result.model) {
        this.applyContinuity(result.model, result.changeSummary, result.stableStateDetected);
        this.lastContinuityFingerprint = fp;
      } else {
        this.sessionManager.recordUpdate(false, null);
        this.performance.failedUpdates += 1;
        this.healthMonitor.recordUpdate(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown continuity error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.sessionManager.recordRecoveryAttempt();
          this.status = "active";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendContinuityLog({
            event: "continuity_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.analyzing = false;
    }
  }

  resetForTesting(): void {
    this.contextStore.resetForTesting();
  }
}
