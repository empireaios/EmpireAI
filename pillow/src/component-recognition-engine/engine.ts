import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import {
  appendRecognitionLog,
  getRecognitionLogs,
  resetRecognitionLogsForTesting,
} from "./recognition-logging.js";
import { RecognitionController } from "./recognition-controller.js";
import {
  buildComponentRecognitionConfiguration,
  type ComponentRecognitionConfiguration,
} from "./configuration.js";
import { COMPONENT_RECOGNITION_SYSTEM_PATH } from "./paths.js";
import type {
  ComponentRecognitionCockpitSnapshot,
  ComponentRecognitionResult,
  ComponentRecognitionState,
} from "./types.js";

export interface ComponentRecognitionEngineOptions {
  configuration?: Partial<ComponentRecognitionConfiguration>;
  autoStart?: boolean;
}

/**
 * Component Recognition Engine (PILLOW-CRE-001 / T1-03).
 * Detects and classifies visible UI components from T1-02 UI state models.
 */
export class ComponentRecognitionEngine {
  private initializedAt: string | null = null;
  private readonly controller: RecognitionController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    options: ComponentRecognitionEngineOptions = {},
  ) {
    const config = buildComponentRecognitionConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new RecognitionController(uiStateMapper, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<ComponentRecognitionState> {
    const doc = await this.reader.readText(COMPONENT_RECOGNITION_SYSTEM_PATH);
    if (!doc?.includes("Component Recognition")) {
      throw new Error(
        `${COMPONENT_RECOGNITION_SYSTEM_PATH} missing — Component Recognition requires T1-03 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRecognitionLog({
      event: "session_start",
      level: "info",
      details: "Component Recognition session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): ComponentRecognitionState {
    if (!this.initializedAt) {
      throw new Error("Component Recognition Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getResultBufferSize(),
    });

    return {
      engineVersion: "PILLOW-CRE-001",
      missionId: "T1-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestResult: this.controller.getLatestResult(),
      previousResult: this.controller.getPreviousResult(),
      health,
      performance,
    };
  }

  async startRecognition(): Promise<ComponentRecognitionState> {
    await this.controller.start();
    return this.getState();
  }

  stopRecognition(): ComponentRecognitionState {
    this.controller.stop();
    return this.getState();
  }

  pauseRecognition(): ComponentRecognitionState {
    this.controller.pause();
    return this.getState();
  }

  resumeRecognition(): ComponentRecognitionState {
    this.controller.resume();
    return this.getState();
  }

  getLatestResult(): ComponentRecognitionResult | null {
    return this.controller.getLatestResult();
  }

  getRecentResults(limit = 5): ComponentRecognitionResult[] {
    return this.controller.getRecentResults(limit);
  }

  recognizeUiState(
    uiState: import("../ui-state-mapper/types.js").UiStateModel,
  ): ComponentRecognitionResult | null {
    return this.controller.recognizeUiState(uiState);
  }

  updateConfiguration(
    overrides: Partial<ComponentRecognitionConfiguration>,
  ): ComponentRecognitionState {
    const next = buildComponentRecognitionConfiguration(this.bootstrap.repositoryRoot, {
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
        `Recognition status: ${state.status}`,
        `Components detected: ${state.performance.totalComponentsDetected}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ComponentRecognitionCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestResult;
    const typeCounts: Record<string, number> = {};
    for (const component of latest?.components ?? []) {
      typeCounts[component.componentType] = (typeCounts[component.componentType] ?? 0) + 1;
    }

    return {
      recognitionStatus: state.status,
      healthStatus: state.health.status,
      recognitionsCompleted: state.performance.successfulRecognitions,
      componentsDetected: latest?.components.length ?? 0,
      latestRecognitionTimestamp: latest?.metadata.timestamp ?? null,
      componentTypeCounts: typeCounts,
      changeDetected: latest?.changeSummary?.hasChanges ?? false,
      confidenceThreshold: state.configuration.confidenceThreshold,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getRecognitionLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createComponentRecognitionEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  options?: ComponentRecognitionEngineOptions,
): ComponentRecognitionEngine {
  return new ComponentRecognitionEngine(bootstrap, uiStateMapper, options);
}

export function resetComponentRecognitionForTesting(): void {
  resetRecognitionLogsForTesting();
}
