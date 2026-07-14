import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import {
  appendLayoutLog,
  getLayoutLogs,
  resetLayoutLogsForTesting,
} from "./layout-logging.js";
import { LayoutController } from "./layout-controller.js";
import {
  buildLayoutUnderstandingConfiguration,
  type LayoutUnderstandingConfiguration,
} from "./configuration.js";
import { LAYOUT_UNDERSTANDING_SYSTEM_PATH } from "./paths.js";
import type {
  LayoutUnderstandingCockpitSnapshot,
  LayoutUnderstandingState,
  LayoutModel,
} from "./types.js";

export interface LayoutUnderstandingEngineOptions {
  configuration?: Partial<LayoutUnderstandingConfiguration>;
  autoStart?: boolean;
}

/**
 * Layout Understanding Engine (PILLOW-LUE-001 / T1-04).
 * Understands structural page layouts from T1-03 component awareness.
 */
export class LayoutUnderstandingEngine {
  private initializedAt: string | null = null;
  private readonly controller: LayoutController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    componentRecognition: ComponentRecognitionEngine,
    options: LayoutUnderstandingEngineOptions = {},
  ) {
    const config = buildLayoutUnderstandingConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new LayoutController(componentRecognition, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<LayoutUnderstandingState> {
    const doc = await this.reader.readText(LAYOUT_UNDERSTANDING_SYSTEM_PATH);
    if (!doc?.includes("Layout Understanding")) {
      throw new Error(
        `${LAYOUT_UNDERSTANDING_SYSTEM_PATH} missing — Layout Understanding requires T1-04 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLayoutLog({
      event: "session_start",
      level: "info",
      details: "Layout Understanding session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): LayoutUnderstandingState {
    if (!this.initializedAt) {
      throw new Error("Layout Understanding Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getLayoutBufferSize(),
    });

    return {
      engineVersion: "PILLOW-LUE-001",
      missionId: "T1-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestLayout: this.controller.getLatestLayout(),
      previousLayout: this.controller.getPreviousLayout(),
      health,
      performance,
    };
  }

  async startLayoutAnalysis(): Promise<LayoutUnderstandingState> {
    await this.controller.start();
    return this.getState();
  }

  stopLayoutAnalysis(): LayoutUnderstandingState {
    this.controller.stop();
    return this.getState();
  }

  pauseLayoutAnalysis(): LayoutUnderstandingState {
    this.controller.pause();
    return this.getState();
  }

  resumeLayoutAnalysis(): LayoutUnderstandingState {
    this.controller.resume();
    return this.getState();
  }

  getLatestLayout(): LayoutModel | null {
    return this.controller.getLatestLayout();
  }

  getRecentLayouts(limit = 5): LayoutModel[] {
    return this.controller.getRecentLayouts(limit);
  }

  analyzeRecognition(
    recognition: import("../component-recognition-engine/types.js").ComponentRecognitionResult,
  ): LayoutModel | null {
    return this.controller.analyzeRecognition(recognition);
  }

  updateConfiguration(
    overrides: Partial<LayoutUnderstandingConfiguration>,
  ): LayoutUnderstandingState {
    const next = buildLayoutUnderstandingConfiguration(this.bootstrap.repositoryRoot, {
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
        `Layout status: ${state.status}`,
        `Regions detected: ${state.performance.totalRegionsDetected}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LayoutUnderstandingCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestLayout;
    const typeCounts: Record<string, number> = {};
    for (const region of latest?.regions ?? []) {
      typeCounts[region.regionType] = (typeCounts[region.regionType] ?? 0) + 1;
    }

    return {
      layoutStatus: state.status,
      healthStatus: state.health.status,
      layoutsGenerated: state.performance.successfulLayouts,
      regionsDetected: latest?.regions.length ?? 0,
      latestLayoutTimestamp: latest?.metadata.timestamp ?? null,
      regionTypeCounts: typeCounts,
      changeDetected: latest?.changeSummary?.hasChanges ?? false,
      confidenceScore: latest?.metadata.confidenceScore ?? 0,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getLayoutLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLayoutUnderstandingEngine(
  bootstrap: EmpireBootstrapContext,
  componentRecognition: ComponentRecognitionEngine,
  options?: LayoutUnderstandingEngineOptions,
): LayoutUnderstandingEngine {
  return new LayoutUnderstandingEngine(bootstrap, componentRecognition, options);
}

export function resetLayoutUnderstandingForTesting(): void {
  resetLayoutLogsForTesting();
}
