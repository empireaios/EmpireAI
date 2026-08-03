import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioPerformanceEngineConfiguration,
  type PortfolioPerformanceEngineConfiguration,
} from "./configuration.js";
import { appendPpeLog, getPpeLogs, resetPpeLogsForTesting } from "./ppe-logging.js";
import { PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzePortfolioInput,
  CalculatePortfolioKpisInput,
  CompareCompaniesInput,
  ConnectPortfolioPerformanceInput,
  MeasureCompanyPerformanceInput,
  PerformanceCockpitSnapshot,
  PerformanceRunReport,
  PortfolioPerformanceEngineState,
  RecommendPerformanceInput,
  RunPerformanceDiagnosticsInput,
} from "./types.js";
import { PortfolioPerformanceController } from "./portfolio-performance-controller.js";
import {
  PortfolioPerformanceManager,
  type PortfolioPerformanceEngineDependencies,
} from "./portfolio-performance-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioPerformanceEngineOptions {
  configuration?: Partial<PortfolioPerformanceEngineConfiguration>;
}

export type { PortfolioPerformanceEngineDependencies };

/**
 * Portfolio Performance Engine (PILLOW-PPE-001 / X2-03).
 * Unified portfolio performance analytics — structural signals only.
 */
export class PortfolioPerformanceEngine {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioPerformanceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioPerformanceEngineDependencies,
    options: PortfolioPerformanceEngineOptions = {},
  ) {
    const config = buildPortfolioPerformanceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioPerformanceManager(dependencies);
    this.controller = new PortfolioPerformanceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioPerformanceEngineState> {
    const doc = await this.reader.readText(PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Performance Engine")) {
      throw new Error(
        `${PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH} missing — Portfolio Performance Engine requires X2-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPpeLog({
      event: "PORTFOLIO_PERFORMANCE_ENGINE_ready",
      level: "info",
      details: "X2-03 Portfolio Performance Engine initialized",
    });
    return this.getState();
  }

  getState(): PortfolioPerformanceEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Portfolio Performance Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getPerformanceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPerformanceRecords: records.length,
      averagePerformanceScore: this.controller.getManager().averagePerformanceScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PPE-001",
      missionId: "X2-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioPerformanceEngine(
    input: ConnectPortfolioPerformanceInput = {},
  ): PerformanceRunReport {
    return this.controller.connectPortfolioPerformanceEngine(input);
  }

  measureCompanyPerformance(input: MeasureCompanyPerformanceInput): PerformanceRunReport {
    return this.controller.measureCompanyPerformance(input);
  }

  compareCompanies(input: CompareCompaniesInput = {}): PerformanceRunReport {
    return this.controller.compareCompanies(input);
  }

  calculatePortfolioKpis(input: CalculatePortfolioKpisInput = {}): PerformanceRunReport {
    return this.controller.calculatePortfolioKpis(input);
  }

  analyzePortfolio(input: AnalyzePortfolioInput = {}): PerformanceRunReport {
    return this.controller.analyzePortfolio(input);
  }

  generateRecommendations(input: RecommendPerformanceInput = {}): PerformanceRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunPerformanceDiagnosticsInput = {}): PerformanceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): PerformanceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPerformanceRecords() {
    return this.controller.getManager().getPerformanceRecords();
  }

  updateConfiguration(
    overrides: Partial<PortfolioPerformanceEngineConfiguration>,
  ): PortfolioPerformanceEngineState {
    const next = buildPortfolioPerformanceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Engine status: ${state.status}`,
        `Performance records: ${state.health.totalPerformanceRecords}`,
        `Average score: ${state.health.averagePerformanceScore}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No performance operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PerformanceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalPerformanceRecords: state.health.totalPerformanceRecords,
      averagePerformanceScore: state.health.averagePerformanceScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) + (deps?.multiCompanyRegistry ? 1 : 0),
      recentLogs: getPpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioPerformanceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioPerformanceEngineDependencies,
  options?: PortfolioPerformanceEngineOptions,
): PortfolioPerformanceEngine {
  return new PortfolioPerformanceEngine(bootstrap, dependencies, options);
}

export function resetPortfolioPerformanceEngineForTesting(): void {
  resetPpeLogsForTesting();
  new PortfolioPerformanceManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
