import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import { appendMappingLog, getMappingLogs, resetMappingLogsForTesting } from "./mapping-logging.js";
import { MappingController } from "./mapping-controller.js";
import { buildUiStateMapperConfiguration, type UiStateMapperConfiguration } from "./configuration.js";
import { UI_STATE_MAPPER_SYSTEM_PATH } from "./paths.js";
import type {
  UiStateMapperCockpitSnapshot,
  UiStateMapperState,
  UiStateModel,
} from "./types.js";

export interface UiStateMapperEngineOptions {
  configuration?: Partial<UiStateMapperConfiguration>;
  autoStart?: boolean;
}

/**
 * UI State Mapper (PILLOW-USM-001 / T1-02).
 * Converts Visual Capture frames into machine-readable UI state models.
 */
export class UiStateMapperEngine {
  private initializedAt: string | null = null;
  private readonly controller: MappingController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    visualCapture: VisualCaptureEngine,
    options: UiStateMapperEngineOptions = {},
  ) {
    const config = buildUiStateMapperConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new MappingController(visualCapture, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<UiStateMapperState> {
    const doc = await this.reader.readText(UI_STATE_MAPPER_SYSTEM_PATH);
    if (!doc?.includes("UI State Mapper")) {
      throw new Error(
        `${UI_STATE_MAPPER_SYSTEM_PATH} missing — UI State Mapper requires T1-02 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMappingLog({
      event: "session_start",
      level: "info",
      details: "UI State Mapper session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): UiStateMapperState {
    if (!this.initializedAt) {
      throw new Error("UI State Mapper not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getStateBufferSize(),
    });

    return {
      engineVersion: "PILLOW-USM-001",
      missionId: "T1-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestState: this.controller.getLatestState(),
      previousState: this.controller.getPreviousState(),
      health,
      performance,
    };
  }

  async startMapping(): Promise<UiStateMapperState> {
    await this.controller.start();
    return this.getState();
  }

  stopMapping(): UiStateMapperState {
    this.controller.stop();
    return this.getState();
  }

  pauseMapping(): UiStateMapperState {
    this.controller.pause();
    return this.getState();
  }

  resumeMapping(): UiStateMapperState {
    this.controller.resume();
    return this.getState();
  }

  getLatestState(): UiStateModel | null {
    return this.controller.getLatestState();
  }

  getRecentStates(limit = 5): UiStateModel[] {
    return this.controller.getRecentStates(limit);
  }

  processFrame(frame: import("../visual-capture-engine/types.js").CaptureFrame): UiStateModel | null {
    return this.controller.processFrame(frame);
  }

  updateConfiguration(overrides: Partial<UiStateMapperConfiguration>): UiStateMapperState {
    const next = buildUiStateMapperConfiguration(this.bootstrap.repositoryRoot, {
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
        `Mapping status: ${state.status}`,
        `States generated: ${state.performance.successfulStates}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): UiStateMapperCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestState;
    return {
      mappingStatus: state.status,
      healthStatus: state.health.status,
      statesGenerated: state.performance.successfulStates,
      latestStateTimestamp: latest?.metadata.timestamp ?? null,
      viewportDimensions: latest
        ? `${latest.metadata.viewport.width}x${latest.metadata.viewport.height}`
        : "unknown",
      regionCount: latest?.screen.regions.length ?? 0,
      changeDetected: latest?.changeSummary?.hasChanges ?? false,
      serializationFormat: state.configuration.serializationFormat,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getMappingLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createUiStateMapperEngine(
  bootstrap: EmpireBootstrapContext,
  visualCapture: VisualCaptureEngine,
  options?: UiStateMapperEngineOptions,
): UiStateMapperEngine {
  return new UiStateMapperEngine(bootstrap, visualCapture, options);
}

export function resetUiStateMapperForTesting(): void {
  resetMappingLogsForTesting();
}
