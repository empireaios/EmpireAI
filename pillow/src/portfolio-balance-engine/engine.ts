import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioBalanceEngineConfiguration,
  type PortfolioBalanceEngineConfiguration,
} from "./configuration.js";
import { appendPbeLog, getPbeLogs, resetPbeLogsForTesting } from "./pbe-logging.js";
import { PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeConcentrationInput,
  AnalyzeExposureInput,
  BalanceCockpitSnapshot,
  BalanceRunReport,
  ConnectPortfolioBalanceInput,
  DetectImbalanceInput,
  MeasureDiversificationInput,
  OptimizePortfolioBalanceInput,
  PortfolioBalanceEngineState,
  RecommendBalanceInput,
  RunBalanceDiagnosticsInput,
} from "./types.js";
import { PortfolioBalanceController } from "./portfolio-balance-controller.js";
import {
  PortfolioBalanceManager,
  type PortfolioBalanceEngineDependencies,
} from "./portfolio-balance-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioBalanceEngineOptions {
  configuration?: Partial<PortfolioBalanceEngineConfiguration>;
}

export type { PortfolioBalanceEngineDependencies };

/**
 * Portfolio Balance Engine (PILLOW-PBE-001 / X2-08).
 * Portfolio optimization — healthy diversification via advisory balancing only.
 */
export class PortfolioBalanceEngine {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioBalanceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioBalanceEngineDependencies,
    options: PortfolioBalanceEngineOptions = {},
  ) {
    const config = buildPortfolioBalanceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioBalanceManager(dependencies);
    this.controller = new PortfolioBalanceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioBalanceEngineState> {
    const doc = await this.reader.readText(PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Balance Engine")) {
      throw new Error(
        `${PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH} missing — Portfolio Balance Engine requires X2-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPbeLog({
      event: "PORTFOLIO_BALANCE_ENGINE_ready",
      level: "info",
      details: "X2-08 Portfolio Balance Engine initialized",
    });
    return this.getState();
  }

  getState(): PortfolioBalanceEngineState {
    if (!this.initializedAt) {
      throw new Error("Portfolio Balance Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBalanceRecords: this.controller.getManager().getBalanceRecords().length,
      latestDiversificationScore: this.controller.getManager().latestDiversificationScore(),
      imbalanceCount: this.controller.getManager().imbalanceCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PBE-001",
      missionId: "X2-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioBalanceEngine(input: ConnectPortfolioBalanceInput = {}): BalanceRunReport {
    return this.controller.connectPortfolioBalanceEngine(input);
  }

  measureDiversification(input: MeasureDiversificationInput = {}): BalanceRunReport {
    return this.controller.measureDiversification(input);
  }

  analyzeConcentration(input: AnalyzeConcentrationInput = {}): BalanceRunReport {
    return this.controller.analyzeConcentration(input);
  }

  analyzeExposure(input: AnalyzeExposureInput = {}): BalanceRunReport {
    return this.controller.analyzeExposure(input);
  }

  detectImbalance(input: DetectImbalanceInput = {}): BalanceRunReport {
    return this.controller.detectImbalance(input);
  }

  optimizePortfolioBalance(input: OptimizePortfolioBalanceInput = {}): BalanceRunReport {
    return this.controller.optimizePortfolioBalance(input);
  }

  generateRecommendations(input: RecommendBalanceInput = {}): BalanceRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunBalanceDiagnosticsInput = {}): BalanceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): BalanceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBalanceRecords() {
    return this.controller.getManager().getBalanceRecords();
  }

  updateConfiguration(
    overrides: Partial<PortfolioBalanceEngineConfiguration>,
  ): PortfolioBalanceEngineState {
    const next = buildPortfolioBalanceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Balance records: ${state.health.totalBalanceRecords}`,
        `Diversification: ${state.health.latestDiversificationScore}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No balance operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BalanceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;
    const latest = this.controller.getManager().getBalanceRecords().at(-1);

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBalanceRecords: state.health.totalBalanceRecords,
      latestDiversificationScore: state.health.latestDiversificationScore,
      imbalanceDetected: latest?.imbalanceDetected ?? false,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0),
      recentLogs: getPbeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioBalanceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioBalanceEngineDependencies,
  options?: PortfolioBalanceEngineOptions,
): PortfolioBalanceEngine {
  return new PortfolioBalanceEngine(bootstrap, dependencies, options);
}

export function resetPortfolioBalanceEngineForTesting(): void {
  resetPbeLogsForTesting();
  new PortfolioBalanceManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
