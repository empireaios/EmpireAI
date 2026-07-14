import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import {
  appendNavigationLog,
  getNavigationLogs,
  resetNavigationLogsForTesting,
} from "./navigation-logging.js";
import { NavigationController } from "./navigation-controller.js";
import {
  buildNavigationMappingConfiguration,
  type NavigationMappingConfiguration,
} from "./configuration.js";
import { NAVIGATION_MAPPING_SYSTEM_PATH } from "./paths.js";
import type {
  NavigationMappingCockpitSnapshot,
  NavigationMappingState,
  NavigationGraph,
} from "./types.js";

export interface NavigationMappingEngineOptions {
  configuration?: Partial<NavigationMappingConfiguration>;
  autoStart?: boolean;
}

/**
 * Navigation Mapping Engine (PILLOW-NME-001 / T1-05).
 * Learns application navigation flow from T1-04 layout understanding.
 */
export class NavigationMappingEngine {
  private initializedAt: string | null = null;
  private readonly controller: NavigationController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    layoutUnderstanding: LayoutUnderstandingEngine,
    options: NavigationMappingEngineOptions = {},
  ) {
    const config = buildNavigationMappingConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new NavigationController(layoutUnderstanding, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<NavigationMappingState> {
    const doc = await this.reader.readText(NAVIGATION_MAPPING_SYSTEM_PATH);
    if (!doc?.includes("Navigation Mapping")) {
      throw new Error(
        `${NAVIGATION_MAPPING_SYSTEM_PATH} missing — Navigation Mapping requires T1-05 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendNavigationLog({
      event: "session_start",
      level: "info",
      details: "Navigation Mapping session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): NavigationMappingState {
    if (!this.initializedAt) {
      throw new Error("Navigation Mapping Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getGraphBufferSize(),
    });

    return {
      engineVersion: "PILLOW-NME-001",
      missionId: "T1-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestGraph: this.controller.getLatestGraph(),
      previousGraph: this.controller.getPreviousGraph(),
      cumulativeGraph: this.controller.getCumulativeGraph(),
      health,
      performance,
    };
  }

  async startNavigationMapping(): Promise<NavigationMappingState> {
    await this.controller.start();
    return this.getState();
  }

  stopNavigationMapping(): NavigationMappingState {
    this.controller.stop();
    return this.getState();
  }

  pauseNavigationMapping(): NavigationMappingState {
    this.controller.pause();
    return this.getState();
  }

  resumeNavigationMapping(): NavigationMappingState {
    this.controller.resume();
    return this.getState();
  }

  getLatestGraph(): NavigationGraph | null {
    return this.controller.getLatestGraph();
  }

  getCumulativeGraph(): NavigationGraph | null {
    return this.controller.getCumulativeGraph();
  }

  getRecentGraphs(limit = 5): NavigationGraph[] {
    return this.controller.getRecentGraphs(limit);
  }

  mapLayout(layout: import("../layout-understanding-engine/types.js").LayoutModel): NavigationGraph | null {
    return this.controller.mapLayout(layout);
  }

  updateConfiguration(
    overrides: Partial<NavigationMappingConfiguration>,
  ): NavigationMappingState {
    const next = buildNavigationMappingConfiguration(this.bootstrap.repositoryRoot, {
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
        `Nodes mapped: ${state.performance.totalNodes}`,
        `Edges mapped: ${state.performance.totalEdges}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): NavigationMappingCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestGraph;

    return {
      mappingStatus: state.status,
      healthStatus: state.health.status,
      graphsGenerated: state.performance.successfulMappings,
      nodesMapped: latest?.nodes.length ?? 0,
      edgesMapped: latest?.edges.length ?? 0,
      currentScreenId: latest?.metadata.currentScreenId ?? null,
      currentRouteId: latest?.metadata.currentRouteId ?? null,
      latestGraphTimestamp: latest?.metadata.timestamp ?? null,
      transitionDetected: latest?.changeSummary?.hasChanges ?? false,
      confidenceScore: latest?.metadata.confidenceScore ?? 0,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getNavigationLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createNavigationMappingEngine(
  bootstrap: EmpireBootstrapContext,
  layoutUnderstanding: LayoutUnderstandingEngine,
  options?: NavigationMappingEngineOptions,
): NavigationMappingEngine {
  return new NavigationMappingEngine(bootstrap, layoutUnderstanding, options);
}

export function resetNavigationMappingForTesting(): void {
  resetNavigationLogsForTesting();
}
