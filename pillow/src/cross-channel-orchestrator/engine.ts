import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCrossChannelOrchestratorConfiguration,
  type CrossChannelOrchestratorConfiguration,
} from "./configuration.js";
import { appendCcoLog, getCcoLogs, resetCcoLogsForTesting } from "./cco-logging.js";
import { CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectCrossChannelOrchestratorInput,
  CoordinateCampaignsInput,
  OrchestrationActionInput,
  OrchestrationCockpitSnapshot,
  OrchestrationRunReport,
  CrossChannelOrchestratorState,
} from "./types.js";
import { CrossChannelOrchestratorController } from "./cross-channel-orchestrator-controller.js";
import {
  CrossChannelOrchestratorManager,
  type CrossChannelOrchestratorDependencies,
} from "./cross-channel-orchestrator-manager.js";

export interface CrossChannelOrchestratorOptions {
  configuration?: Partial<CrossChannelOrchestratorConfiguration>;
}

export type { CrossChannelOrchestratorDependencies };

/**
 * Cross-Channel Orchestrator (PILLOW-CCO-001 / R5-18).
 * Unified marketing execution for coordinated campaigns — structural only.
 */
export class CrossChannelOrchestrator {
  private initializedAt: string | null = null;
  private readonly controller: CrossChannelOrchestratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CrossChannelOrchestratorDependencies,
    options: CrossChannelOrchestratorOptions = {},
  ) {
    const config = buildCrossChannelOrchestratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CrossChannelOrchestratorManager(dependencies);
    this.controller = new CrossChannelOrchestratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CrossChannelOrchestratorState> {
    const doc = await this.reader.readText(CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH);
    if (!doc?.includes("Cross-Channel Orchestrator")) {
      throw new Error(
        `${CROSS_CHANNEL_ORCHESTRATOR_SYSTEM_PATH} missing — requires R5-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCcoLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-18 Cross-Channel Orchestrator initialized",
    });
    return this.getState();
  }

  getState(): CrossChannelOrchestratorState {
    if (!this.initializedAt) {
      throw new Error("Cross-Channel Orchestrator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const orchestrations = this.controller.getManager().getOrchestrationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalOrchestrationRecords: orchestrations.length,
      conflictedOrchestrations: this.controller.getConflictedCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CCO-001",
      missionId: "R5-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCrossChannelOrchestrator(
    input: ConnectCrossChannelOrchestratorInput = {},
  ): OrchestrationRunReport {
    return this.controller.connectCrossChannelOrchestrator(input);
  }

  coordinateCampaigns(input: CoordinateCampaignsInput = {}): OrchestrationRunReport {
    return this.controller.coordinateCampaigns(input);
  }

  synchronizeExecution(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.synchronizeExecution(input);
  }

  synchronizeSchedules(
    input: OrchestrationActionInput & { schedule?: string } = {},
  ): OrchestrationRunReport {
    return this.controller.synchronizeSchedules(input);
  }

  coordinateJourneys(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.coordinateJourneys(input);
  }

  coordinateChannels(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.coordinateChannels(input);
  }

  coordinateBudgets(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.coordinateBudgets(input);
  }

  coordinateAssets(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.coordinateAssets(input);
  }

  coordinateExperiments(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.coordinateExperiments(input);
  }

  detectConflicts(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    return this.controller.detectConflicts(input);
  }

  getLatestReport(): OrchestrationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getOrchestrationRecords() {
    return this.controller.getManager().getOrchestrationRecords();
  }

  updateConfiguration(
    overrides: Partial<CrossChannelOrchestratorConfiguration>,
  ): CrossChannelOrchestratorState {
    const next = buildCrossChannelOrchestratorConfiguration(this.bootstrap.repositoryRoot, {
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
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Cross-Channel Orchestrator status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No cross-channel orchestration operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OrchestrationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalOrchestrationRecords: state.health.totalOrchestrationRecords,
      conflictedOrchestrations: state.health.conflictedOrchestrations,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getCcoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCrossChannelOrchestrator(
  bootstrap: EmpireBootstrapContext,
  dependencies: CrossChannelOrchestratorDependencies,
  options?: CrossChannelOrchestratorOptions,
): CrossChannelOrchestrator {
  return new CrossChannelOrchestrator(bootstrap, dependencies, options);
}

export function resetCrossChannelOrchestratorForTesting(): void {
  resetCcoLogsForTesting();
  new CrossChannelOrchestratorManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    seoIntelligence: null,
    campaignManager: null,
    audienceIntelligence: null,
    attributionEngine: null,
    marketingAnalyticsDashboard: null,
    aiCampaignGenerator: null,
    budgetOptimizationEngine: null,
    conversionIntelligence: null,
    competitorMarketingMonitor: null,
    viralTrendIntelligence: null,
    marketingExperimentEngine: null,
  }).resetForTesting();
}
