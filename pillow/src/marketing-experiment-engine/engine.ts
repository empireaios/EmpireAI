import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketingExperimentEngineConfiguration,
  type MarketingExperimentEngineConfiguration,
} from "./configuration.js";
import { appendMeeLog, getMeeLogs, resetMeeLogsForTesting } from "./mee-logging.js";
import { MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeExperimentInput,
  ArchiveExperimentInput,
  AssignAudienceInput,
  ConnectMarketingExperimentEngineInput,
  CreateExperimentInput,
  ExperimentCockpitSnapshot,
  ExperimentRunReport,
  ManageExperimentInput,
  MarketingExperimentEngineState,
} from "./types.js";
import { MarketingExperimentController } from "./marketing-experiment-controller.js";
import {
  MarketingExperimentManager,
  type MarketingExperimentEngineDependencies,
} from "./marketing-experiment-manager.js";

export interface MarketingExperimentEngineOptions {
  configuration?: Partial<MarketingExperimentEngineConfiguration>;
}

export type { MarketingExperimentEngineDependencies };

/**
 * Marketing Experiment Engine (PILLOW-MEE-001 / R5-17).
 * A/B testing framework for continuous optimization — structural only.
 */
export class MarketingExperimentEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketingExperimentController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: MarketingExperimentEngineDependencies,
    options: MarketingExperimentEngineOptions = {},
  ) {
    const config = buildMarketingExperimentEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketingExperimentManager(dependencies);
    this.controller = new MarketingExperimentController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketingExperimentEngineState> {
    const doc = await this.reader.readText(MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Marketing Experiment Engine")) {
      throw new Error(
        `${MARKETING_EXPERIMENT_ENGINE_SYSTEM_PATH} missing — requires R5-17 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMeeLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-17 Marketing Experiment Engine initialized",
    });
    return this.getState();
  }

  getState(): MarketingExperimentEngineState {
    if (!this.initializedAt) {
      throw new Error("Marketing Experiment Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const experiments = this.controller.getManager().getExperimentRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalExperimentRecords: experiments.length,
      runningExperiments: this.controller.getRunningExperiments(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MEE-001",
      missionId: "R5-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMarketingExperimentEngine(
    input: ConnectMarketingExperimentEngineInput = {},
  ): ExperimentRunReport {
    return this.controller.connectMarketingExperimentEngine(input);
  }

  createExperiment(input: CreateExperimentInput = {}): ExperimentRunReport {
    return this.controller.createExperiment(input);
  }

  manageAbTest(input: ManageExperimentInput = {}): ExperimentRunReport {
    return this.controller.manageAbTest(input);
  }

  manageMultivariateTest(input: ManageExperimentInput = {}): ExperimentRunReport {
    return this.controller.manageMultivariateTest(input);
  }

  assignAudience(input: AssignAudienceInput = {}): ExperimentRunReport {
    return this.controller.assignAudience(input);
  }

  measurePerformance(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    return this.controller.measurePerformance(input);
  }

  compareVariants(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    return this.controller.compareVariants(input);
  }

  detectSignificance(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    return this.controller.detectSignificance(input);
  }

  recommendWinner(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    return this.controller.recommendWinner(input);
  }

  archiveExperiment(input: ArchiveExperimentInput = {}): ExperimentRunReport {
    return this.controller.archiveExperiment(input);
  }

  getLatestReport(): ExperimentRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getExperimentRecords() {
    return this.controller.getManager().getExperimentRecords();
  }

  updateConfiguration(
    overrides: Partial<MarketingExperimentEngineConfiguration>,
  ): MarketingExperimentEngineState {
    const next = buildMarketingExperimentEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Marketing Experiment Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No marketing experiment operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExperimentCockpitSnapshot {
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
      totalExperimentRecords: state.health.totalExperimentRecords,
      runningExperiments: state.health.runningExperiments,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getMeeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMarketingExperimentEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: MarketingExperimentEngineDependencies,
  options?: MarketingExperimentEngineOptions,
): MarketingExperimentEngine {
  return new MarketingExperimentEngine(bootstrap, dependencies, options);
}

export function resetMarketingExperimentEngineForTesting(): void {
  resetMeeLogsForTesting();
  new MarketingExperimentManager({
    marketingFramework: null,
    campaignManager: null,
    audienceIntelligence: null,
    attributionEngine: null,
    marketingAnalyticsDashboard: null,
    aiCampaignGenerator: null,
    budgetOptimizationEngine: null,
    conversionIntelligence: null,
    viralTrendIntelligence: null,
  }).resetForTesting();
}
