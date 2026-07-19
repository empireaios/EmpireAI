import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousMarketingEngineConfiguration,
  type AutonomousMarketingEngineConfiguration,
} from "./configuration.js";
import { appendAmeLog, getAmeLogs, resetAmeLogsForTesting } from "./ame-logging.js";
import { AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AutonomousMarketingActionInput,
  AutonomousMarketingCockpitSnapshot,
  AutonomousMarketingEngineState,
  AutonomousMarketingRunReport,
  ConnectAutonomousMarketingEngineInput,
  MonitorPerformanceInput,
} from "./types.js";
import { AutonomousMarketingController } from "./autonomous-marketing-controller.js";
import {
  AutonomousMarketingManager,
  type AutonomousMarketingEngineDependencies,
} from "./autonomous-marketing-manager.js";

export interface AutonomousMarketingEngineOptions {
  configuration?: Partial<AutonomousMarketingEngineConfiguration>;
}

export type { AutonomousMarketingEngineDependencies };

/**
 * Autonomous Marketing Engine (PILLOW-AME-001 / R5-19).
 * Self-optimizing campaigns with minimal manual intervention — structural only.
 */
export class AutonomousMarketingEngine {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousMarketingController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AutonomousMarketingEngineDependencies,
    options: AutonomousMarketingEngineOptions = {},
  ) {
    const config = buildAutonomousMarketingEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AutonomousMarketingManager(dependencies);
    this.controller = new AutonomousMarketingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousMarketingEngineState> {
    const doc = await this.reader.readText(AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Marketing Engine")) {
      throw new Error(
        `${AUTONOMOUS_MARKETING_ENGINE_SYSTEM_PATH} missing — requires R5-19 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAmeLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-19 Autonomous Marketing Engine initialized",
    });
    return this.getState();
  }

  getState(): AutonomousMarketingEngineState {
    if (!this.initializedAt) {
      throw new Error("Autonomous Marketing Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const autonomousRecords = this.controller.getManager().getAutonomousMarketingRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAutonomousRecords: autonomousRecords.length,
      pendingApprovals: this.controller.getManager().getPendingApprovals(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AME-001",
      missionId: "R5-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAutonomousMarketingEngine(
    input: ConnectAutonomousMarketingEngineInput = {},
  ): AutonomousMarketingRunReport {
    return this.controller.connectAutonomousMarketingEngine(input);
  }

  monitorPerformance(input: MonitorPerformanceInput = {}): AutonomousMarketingRunReport {
    return this.controller.monitorPerformance(input);
  }

  generateRecommendations(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    return this.controller.generateRecommendations(input);
  }

  optimizeBudgets(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    return this.controller.optimizeBudgets(input);
  }

  optimizeAudience(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    return this.controller.optimizeAudience(input);
  }

  optimizeScheduling(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    return this.controller.optimizeScheduling(input);
  }

  optimizeCreative(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    return this.controller.optimizeCreative(input);
  }

  optimizeChannelAllocation(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    return this.controller.optimizeChannelAllocation(input);
  }

  respondToPerformanceChanges(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    return this.controller.respondToPerformanceChanges(input);
  }

  executeApprovedOptimizations(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    return this.controller.executeApprovedOptimizations(input);
  }

  getLatestReport(): AutonomousMarketingRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAutonomousMarketingRecords() {
    return this.controller.getManager().getAutonomousMarketingRecords();
  }

  updateConfiguration(
    overrides: Partial<AutonomousMarketingEngineConfiguration>,
  ): AutonomousMarketingEngineState {
    const next = buildAutonomousMarketingEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Autonomous Marketing Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No autonomous marketing operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AutonomousMarketingCockpitSnapshot {
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
      totalAutonomousRecords: state.health.totalAutonomousRecords,
      pendingApprovals: state.health.pendingApprovals,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getAmeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAutonomousMarketingEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AutonomousMarketingEngineDependencies,
  options?: AutonomousMarketingEngineOptions,
): AutonomousMarketingEngine {
  return new AutonomousMarketingEngine(bootstrap, dependencies, options);
}

export function resetAutonomousMarketingEngineForTesting(): void {
  resetAmeLogsForTesting();
  new AutonomousMarketingManager({
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
    creativeAssetManager: null,
    aiCampaignGenerator: null,
    budgetOptimizationEngine: null,
    conversionIntelligence: null,
    competitorMarketingMonitor: null,
    viralTrendIntelligence: null,
    marketingExperimentEngine: null,
    crossChannelOrchestrator: null,
  }).resetForTesting();
}
