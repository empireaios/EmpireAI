import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import {
  appendMemoryLog,
  getMemoryLogs,
  resetMemoryLogsForTesting,
} from "./memory-logging.js";
import { MemoryController } from "./memory-controller.js";
import {
  buildVisualMemoryConfiguration,
  type VisualMemoryConfiguration,
} from "./configuration.js";
import { VISUAL_MEMORY_SYSTEM_PATH } from "./paths.js";
import type {
  MemoryComparisonResult,
  VisualMemoryCockpitSnapshot,
  VisualMemoryRecord,
  VisualMemoryState,
} from "./types.js";

export interface VisualMemoryEngineOptions {
  configuration?: Partial<VisualMemoryConfiguration>;
  autoStart?: boolean;
}

/**
 * Visual Memory Engine (PILLOW-VME-001 / T1-08).
 * Stores and retrieves historical UI states from the EmpireAI interface.
 */
export class VisualMemoryEngine {
  private initializedAt: string | null = null;
  private readonly controller: MemoryController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    visualCapture: VisualCaptureEngine,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    options: VisualMemoryEngineOptions = {},
  ) {
    const config = buildVisualMemoryConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new MemoryController(
      bootstrap.repositoryRoot,
      visualCapture,
      uiStateMapper,
      componentRecognition,
      layoutUnderstanding,
      navigationMapping,
      interactionTracking,
      contextAwareness,
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<VisualMemoryState> {
    const doc = await this.reader.readText(VISUAL_MEMORY_SYSTEM_PATH);
    if (!doc?.includes("Visual Memory")) {
      throw new Error(
        `${VISUAL_MEMORY_SYSTEM_PATH} missing — Visual Memory requires T1-08 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMemoryLog({
      event: "session_start",
      level: "info",
      details: "Visual Memory session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): VisualMemoryState {
    if (!this.initializedAt) {
      throw new Error("Visual Memory Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getMemoryBufferSize(),
    });

    return {
      engineVersion: "PILLOW-VME-001",
      missionId: "T1-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestRecord: this.controller.getLatestRecord(),
      health,
      performance,
    };
  }

  async startVisualMemory(): Promise<VisualMemoryState> {
    await this.controller.start();
    return this.getState();
  }

  stopVisualMemory(): VisualMemoryState {
    this.controller.stop();
    return this.getState();
  }

  pauseVisualMemory(): VisualMemoryState {
    this.controller.pause();
    return this.getState();
  }

  resumeVisualMemory(): VisualMemoryState {
    this.controller.resume();
    return this.getState();
  }

  captureMemoryNow(): VisualMemoryRecord | null {
    return this.controller.captureNow();
  }

  getLatestRecord(): VisualMemoryRecord | null {
    return this.controller.getLatestRecord();
  }

  getRecentRecords(limit = 5): VisualMemoryRecord[] {
    return this.controller.getRecentRecords(limit);
  }

  retrieveRecent(limit?: number): VisualMemoryRecord[] {
    return this.controller.retrieveRecent(limit);
  }

  retrieveBySession(sessionId: string, limit?: number): VisualMemoryRecord[] {
    return this.controller.retrieveBySession(sessionId, limit);
  }

  retrieveByScreen(screenId: string, limit?: number): VisualMemoryRecord[] {
    return this.controller.retrieveByScreen(screenId, limit);
  }

  retrieveById(memoryRecordId: string): VisualMemoryRecord | null {
    return this.controller.retrieveById(memoryRecordId);
  }

  compareWithCurrent(memoryRecordId: string): MemoryComparisonResult | null {
    return this.controller.compareWithCurrent(memoryRecordId);
  }

  runRetentionCleanup(): VisualMemoryState {
    this.controller.runCleanup();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<VisualMemoryConfiguration>,
  ): VisualMemoryState {
    const next = buildVisualMemoryConfiguration(this.bootstrap.repositoryRoot, {
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
        `Memory status: ${state.status}`,
        `Records stored: ${state.performance.successfulRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VisualMemoryCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestRecord;

    return {
      memoryStatus: state.status,
      healthStatus: state.health.status,
      recordsStored: state.performance.successfulRecords,
      latestScreenId: latest?.screenId ?? null,
      latestWorkflowContextId: latest?.sourceWorkflowContextId ?? null,
      storageUsedBytes: state.health.storageUsedBytes,
      retentionCategory: latest?.retentionCategory ?? null,
      confidenceScore: latest?.confidence ?? 0,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getMemoryLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createVisualMemoryEngine(
  bootstrap: EmpireBootstrapContext,
  visualCapture: VisualCaptureEngine,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  options?: VisualMemoryEngineOptions,
): VisualMemoryEngine {
  return new VisualMemoryEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    contextAwareness,
    options,
  );
}

export function resetVisualMemoryForTesting(): void {
  resetMemoryLogsForTesting();
}