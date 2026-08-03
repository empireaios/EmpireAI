import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioForecastEngineConfiguration,
  type PortfolioForecastEngineConfiguration,
} from "./configuration.js";
import { appendPfeLog, getPfeLogs, resetPfeLogsForTesting } from "./pfe-logging.js";
import { PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectPortfolioForecastEngineInput,
  ForecastCockpitSnapshot,
  ForecastRequestInput,
  ForecastRunReport,
  GenerateExecutiveForecastInput,
  GenerateScenariosInput,
  PortfolioForecastEngineState,
  RunForecastDiagnosticsInput,
} from "./types.js";
import { PortfolioForecastController } from "./portfolio-forecast-controller.js";
import {
  PortfolioForecastManager,
  type PortfolioForecastEngineDependencies,
} from "./portfolio-forecast-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioForecastEngineOptions {
  configuration?: Partial<PortfolioForecastEngineConfiguration>;
}

export type { PortfolioForecastEngineDependencies };

/**
 * Portfolio Forecast Engine (PILLOW-PFE-001 / X2-14).
 * Portfolio forecasting — structural projections; never guaranteed outcomes.
 */
export class PortfolioForecastEngine {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioForecastController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioForecastEngineDependencies,
    options: PortfolioForecastEngineOptions = {},
  ) {
    const config = buildPortfolioForecastEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioForecastManager(dependencies);
    this.controller = new PortfolioForecastController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioForecastEngineState> {
    const doc = await this.reader.readText(PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Forecast Engine")) {
      throw new Error(
        `${PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH} missing — requires X2-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPfeLog({
      event: "PORTFOLIO_FORECAST_ENGINE_ready",
      level: "info",
      details: "X2-14 Portfolio Forecast Engine initialized",
    });
    return this.getState();
  }

  getState(): PortfolioForecastEngineState {
    if (!this.initializedAt) {
      throw new Error("Portfolio Forecast Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const forecasts = this.controller.getManager().getForecastRecords();
    const scenarios = this.controller.getManager().getScenarios();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalForecastRecords: forecasts.length,
      totalScenarios: scenarios.length,
      averageConfidence: this.controller.getManager().averageConfidence(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PFE-001",
      missionId: "X2-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioForecastEngine(
    input: ConnectPortfolioForecastEngineInput = {},
  ): ForecastRunReport {
    return this.controller.connectPortfolioForecastEngine(input);
  }

  forecastRevenue(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastRevenue(input);
  }

  forecastProfit(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastProfit(input);
  }

  forecastGrowth(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastGrowth(input);
  }

  forecastCapital(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastCapital(input);
  }

  forecastCustomerGrowth(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastCustomerGrowth(input);
  }

  forecastSupplierCapacity(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastSupplierCapacity(input);
  }

  forecastRisks(input: ForecastRequestInput = {}): ForecastRunReport {
    return this.controller.forecastRisks(input);
  }

  generateScenarios(input: GenerateScenariosInput = {}): ForecastRunReport {
    return this.controller.generateScenarios(input);
  }

  generateExecutiveForecast(input: GenerateExecutiveForecastInput = {}): ForecastRunReport {
    return this.controller.generateExecutiveForecast(input);
  }

  runDiagnostics(input: RunForecastDiagnosticsInput = {}): ForecastRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ForecastRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getForecastRecords() {
    return this.controller.getManager().getForecastRecords();
  }

  getScenarios() {
    return this.controller.getManager().getScenarios();
  }

  updateConfiguration(
    overrides: Partial<PortfolioForecastEngineConfiguration>,
  ): PortfolioForecastEngineState {
    const next = buildPortfolioForecastEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Forecast records: ${state.health.totalForecastRecords}`,
        `Scenarios: ${state.health.totalScenarios} · avg confidence: ${state.health.averageConfidence}`,
        "Forecasts are never guaranteed outcomes",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No forecast operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ForecastCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalForecastRecords: state.health.totalForecastRecords,
      totalScenarios: state.health.totalScenarios,
      averageConfidence: state.health.averageConfidence,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.portfolioBalanceEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.sharedCustomerIntelligence ? 1 : 0) +
        (deps?.sharedSupplierIntelligence ? 1 : 0),
      recentLogs: getPfeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioForecastEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioForecastEngineDependencies,
  options?: PortfolioForecastEngineOptions,
): PortfolioForecastEngine {
  return new PortfolioForecastEngine(bootstrap, dependencies, options);
}

export function resetPortfolioForecastEngineForTesting(): void {
  resetPfeLogsForTesting();
  new PortfolioForecastManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
    businessHealthRanking: null,
    sharedCustomerIntelligence: null,
    sharedSupplierIntelligence: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
