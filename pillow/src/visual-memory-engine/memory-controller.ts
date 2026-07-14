/** T1-08 — Visual memory orchestration controller. */

import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import { appendMemoryLog } from "./memory-logging.js";
import { MemoryScheduler } from "./memory-scheduler.js";
import { MemoryBuffer } from "./memory-buffer.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { VisualMemoryManager } from "./visual-memory-manager.js";
import { MemoryCaptureEngine } from "./memory-capture-engine.js";
import { MemoryIndexer } from "./memory-indexer.js";
import { MemoryPersistenceStore } from "./memory-persistence-store.js";
import { MemoryRetrievalEngine } from "./memory-retrieval-engine.js";
import { MemoryComparisonEngine } from "./memory-comparison-engine.js";
import { MemoryRetentionManager } from "./memory-retention-manager.js";
import type { VisualMemoryConfiguration } from "./configuration.js";
import type {
  MemoryComparisonResult,
  MemoryPerformanceStats,
  MemoryStatus,
  VisualMemoryRecord,
} from "./types.js";

export class MemoryController {
  private config: VisualMemoryConfiguration;
  private status: MemoryStatus = "idle";
  private recordSequence = 0;
  private lastCaptureFingerprint = "";
  private performance: MemoryPerformanceStats = {
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
  };

  private readonly sessionManager = new VisualMemoryManager();
  private readonly captureEngine = new MemoryCaptureEngine();
  private readonly memoryBuffer: MemoryBuffer;
  private readonly scheduler = new MemoryScheduler();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly indexer = new MemoryIndexer();
  private readonly persistenceStore: MemoryPersistenceStore;
  private retrievalEngine: MemoryRetrievalEngine;
  private readonly comparisonEngine = new MemoryComparisonEngine();
  private readonly retentionManager = new MemoryRetentionManager();

  private latestRecord: VisualMemoryRecord | null = null;
  private capturing = false;

  constructor(
    private repositoryRoot: string,
    private visualCapture: VisualCaptureEngine,
    private uiStateMapper: UiStateMapperEngine,
    private componentRecognition: ComponentRecognitionEngine,
    private layoutUnderstanding: LayoutUnderstandingEngine,
    private navigationMapping: NavigationMappingEngine,
    private interactionTracking: InteractionTrackingEngine,
    private contextAwareness: ContextAwarenessEngine,
    config: VisualMemoryConfiguration,
  ) {
    this.config = config;
    this.memoryBuffer = new MemoryBuffer(Math.min(50, config.maxRecords));
    this.persistenceStore = new MemoryPersistenceStore(repositoryRoot, config);
    this.retrievalEngine = new MemoryRetrievalEngine(this.indexer, this.persistenceStore, config);
  }

  getStatus(): MemoryStatus {
    return this.status;
  }

  getConfiguration(): VisualMemoryConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: VisualMemoryConfiguration): void {
    this.config = config;
    this.memoryBuffer.setLimit(Math.min(50, config.maxRecords));
    this.retrievalEngine = new MemoryRetrievalEngine(this.indexer, this.persistenceStore, config);
    if (this.scheduler.isRunning()) {
      this.stop();
      if (config.enabled) void this.start();
    }
  }

  async initialize(): Promise<void> {
    this.persistenceStore.initialize();
    this.indexer.setEntries(this.persistenceStore.loadIndex());
    const stats = this.persistenceStore.getStorageStats();
    this.healthMonitor.setStorageStats(stats.totalRecords, stats.usedBytes);
    appendMemoryLog({
      event: "engine_initialized",
      level: "info",
      details: `Visual Memory Engine initialized · ${stats.totalRecords} records loaded`,
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
    this.recordSequence = 0;
    this.lastCaptureFingerprint = "";
    this.status = "recording";

    appendMemoryLog({
      event: "memory_start",
      level: "info",
      details: "Visual memory session started",
    });

    this.scheduler.start(
      this.config,
      () => this.memoryTick(),
      () => this.runCleanup(),
    );
  }

  stop(): void {
    this.scheduler.stop();
    this.sessionManager.endSession("stopped");
    this.healthMonitor.markSessionEnd();
    this.status = "stopped";
    appendMemoryLog({ event: "memory_stop", level: "info", details: "Visual memory stopped" });
  }

  pause(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.pause();
    this.sessionManager.setStatus("paused");
    this.status = "paused";
    appendMemoryLog({ event: "memory_pause", level: "info", details: "Visual memory paused" });
  }

  resume(): void {
    if (!this.scheduler.isRunning()) return;
    this.scheduler.resume();
    this.sessionManager.setStatus("recording");
    this.status = "recording";
    appendMemoryLog({ event: "memory_resume", level: "info", details: "Visual memory resumed" });
  }

  getLatestRecord(): VisualMemoryRecord | null {
    return this.latestRecord;
  }

  getRecentRecords(limit = 5): VisualMemoryRecord[] {
    return this.memoryBuffer.getRecent(limit);
  }

  getSession() {
    return this.sessionManager.getSession();
  }

  getPerformance(): MemoryPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getMemoryBufferSize(): number {
    return this.memoryBuffer.size();
  }

  getIndexer() {
    return this.indexer;
  }

  getRetrievalEngine() {
    return this.retrievalEngine;
  }

  captureNow(): VisualMemoryRecord | null {
    const session = this.sessionManager.getSession();
    const sessionId = session?.sessionId ?? `vme-direct-${Date.now()}`;
    this.recordSequence += 1;
    const result = this.captureEngine.capture({
      sessionId,
      recordSequence: this.recordSequence,
      config: this.config,
      visualCapture: this.visualCapture,
      uiStateMapper: this.uiStateMapper,
      componentRecognition: this.componentRecognition,
      layoutUnderstanding: this.layoutUnderstanding,
      navigationMapping: this.navigationMapping,
      interactionTracking: this.interactionTracking,
      contextAwareness: this.contextAwareness,
      store: this.persistenceStore,
    });
    if (result.record && result.payload) {
      this.applyRecord(result.record, result.payload, result.componentIds, result.maskedSensitiveFields);
      return result.record;
    }
    return null;
  }

  retrieveRecent(limit?: number): VisualMemoryRecord[] {
    const records = this.retrievalEngine.retrieveRecent(limit);
    this.performance.retrievals += 1;
    return records;
  }

  retrieveBySession(sessionId: string, limit?: number): VisualMemoryRecord[] {
    this.performance.retrievals += 1;
    return this.retrievalEngine.retrieveBySession(sessionId, limit);
  }

  retrieveByScreen(screenId: string, limit?: number): VisualMemoryRecord[] {
    this.performance.retrievals += 1;
    return this.retrievalEngine.retrieveByScreen(screenId, limit);
  }

  retrieveById(memoryRecordId: string): VisualMemoryRecord | null {
    this.performance.retrievals += 1;
    return this.retrievalEngine.retrieveById(memoryRecordId);
  }

  compareWithCurrent(memoryRecordId: string): MemoryComparisonResult | null {
    const record = this.retrievalEngine.retrieveById(memoryRecordId);
    if (!record) return null;
    this.performance.comparisons += 1;
    return this.comparisonEngine.compare(record, {
      navigationMapping: this.navigationMapping,
      layoutUnderstanding: this.layoutUnderstanding,
      componentRecognition: this.componentRecognition,
      interactionTracking: this.interactionTracking,
    });
  }

  runCleanup(): void {
    const removed = this.retentionManager.applyRetention(
      this.indexer,
      this.persistenceStore,
      this.config,
    );
    if (removed > 0) {
      this.performance.cleanups += 1;
      const stats = this.persistenceStore.getStorageStats();
      this.healthMonitor.setStorageStats(stats.totalRecords, stats.usedBytes);
    }
  }

  resetForTesting(): void {
    this.persistenceStore.resetForTesting();
    this.indexer.setEntries([]);
  }

  private applyRecord(
    record: VisualMemoryRecord,
    payload: import("./memory-persistence-store.js").StoredMemoryPayload,
    componentIds: string[],
    maskedCount: number,
  ): void {
    const started = Date.now();
    try {
      const bytes = this.persistenceStore.write(payload);
      this.indexer.index(record, componentIds);
      this.persistenceStore.saveIndex(this.indexer.getAll());
      const duration = Date.now() - started;

      this.latestRecord = record;
      this.memoryBuffer.push(record);
      this.sessionManager.recordStored(true, record.screenId);
      this.recoveryManager.recordSuccess();
      this.performance.successfulRecords += 1;
      this.performance.totalRecords += 1;
      this.performance.maskedSensitiveFields += maskedCount;
      this.performance.averageStorageDurationMs = Math.round(
        (this.performance.averageStorageDurationMs * (this.performance.successfulRecords - 1) + duration) /
          this.performance.successfulRecords,
      );
      if (duration > this.performance.peakStorageDurationMs) {
        this.performance.peakStorageDurationMs = duration;
      }
      this.healthMonitor.recordStorage(duration, true, bytes);
      const stats = this.persistenceStore.getStorageStats();
      this.healthMonitor.setStorageStats(stats.totalRecords, stats.usedBytes);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Storage failed";
      this.sessionManager.recordStored(false, null);
      this.performance.failedRecords += 1;
      this.healthMonitor.recordStorage(0, false);
      throw new Error(message);
    }
  }

  private fingerprint(): string {
    const uiState = this.uiStateMapper.getLatestState();
    const graph = this.navigationMapping.getLatestGraph();
    const layout = this.layoutUnderstanding.getLatestLayout();
    const context = this.contextAwareness.getLatestContext();
    const events = this.interactionTracking.getRecentEvents(3);
    return [
      uiState?.metadata.stateId ?? "",
      graph?.metadata.graphId ?? "",
      layout?.metadata.layoutId ?? "",
      context?.contextId ?? "",
      events.map((e) => e.eventId).join(","),
    ].join("|");
  }

  private async memoryTick(): Promise<void> {
    if (this.capturing) {
      this.performance.skippedCaptures += 1;
      return;
    }
    this.capturing = true;
    try {
      const session = this.sessionManager.getSession();
      if (!session) {
        this.status = "failed";
        return;
      }

      const fp = this.fingerprint();
      if (fp === this.lastCaptureFingerprint && fp !== "") {
        return;
      }

      this.recordSequence += 1;
      const result = this.captureEngine.capture({
        sessionId: session.sessionId,
        recordSequence: this.recordSequence,
        config: this.config,
        visualCapture: this.visualCapture,
        uiStateMapper: this.uiStateMapper,
        componentRecognition: this.componentRecognition,
        layoutUnderstanding: this.layoutUnderstanding,
        navigationMapping: this.navigationMapping,
        interactionTracking: this.interactionTracking,
        contextAwareness: this.contextAwareness,
        store: this.persistenceStore,
      });

      if (result.record && result.payload) {
        this.applyRecord(
          result.record,
          result.payload,
          result.componentIds,
          result.maskedSensitiveFields,
        );
        this.lastCaptureFingerprint = fp;
        this.status = "recording";
      } else {
        this.sessionManager.recordStored(false, null);
        this.performance.failedRecords += 1;
        this.healthMonitor.recordStorage(0, false);
        const shouldRecover = this.recoveryManager.recordFailure(
          result.error ?? "Unknown memory capture error",
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "recording";
        } else if (this.recoveryManager.getConsecutiveFailures() >= this.config.maxRetryAttempts) {
          this.status = "failed";
          appendMemoryLog({
            event: "memory_failed",
            level: "error",
            details: result.error ?? "Max retries exceeded",
          });
        }
      }
    } finally {
      this.capturing = false;
    }
  }
}
