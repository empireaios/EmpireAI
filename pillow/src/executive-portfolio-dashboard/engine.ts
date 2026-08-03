import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutivePortfolioDashboardConfiguration,
  type ExecutivePortfolioDashboardConfiguration,
} from "./configuration.js";
import { appendEpdLog, getEpdLogs, resetEpdLogsForTesting } from "./epd-logging.js";
import { EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  AggregatePortfolioKpisInput,
  ConnectExecutiveDashboardInput,
  DashboardCockpitSnapshot,
  DrillDownInput,
  ExecutivePortfolioDashboardState,
  GenerateExecutiveAlertsInput,
  RecommendExecutiveInput,
  RefreshDashboardInput,
  RunDashboardDiagnosticsInput,
  DashboardRunReport,
} from "./types.js";
import { ExecutivePortfolioDashboardController } from "./executive-portfolio-dashboard-controller.js";
import {
  ExecutivePortfolioDashboardManager,
  type ExecutivePortfolioDashboardDependencies,
} from "./executive-portfolio-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ExecutivePortfolioDashboardOptions {
  configuration?: Partial<ExecutivePortfolioDashboardConfiguration>;
}

export type { ExecutivePortfolioDashboardDependencies };

/**
 * Executive Portfolio Dashboard (PILLOW-EPD-001 / X2-06).
 * Portfolio cockpit — complete portfolio oversight via structural dashboard records.
 */
export class ExecutivePortfolioDashboard {
  private initializedAt: string | null = null;
  private readonly controller: ExecutivePortfolioDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ExecutivePortfolioDashboardDependencies,
    options: ExecutivePortfolioDashboardOptions = {},
  ) {
    const config = buildExecutivePortfolioDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExecutivePortfolioDashboardManager(dependencies);
    this.controller = new ExecutivePortfolioDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutivePortfolioDashboardState> {
    const doc = await this.reader.readText(EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Executive Portfolio Dashboard")) {
      throw new Error(
        `${EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH} missing — Executive Portfolio Dashboard requires X2-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEpdLog({
      event: "EXECUTIVE_PORTFOLIO_DASHBOARD_ready",
      level: "info",
      details: "X2-06 Executive Portfolio Dashboard initialized",
    });
    return this.getState();
  }

  getState(): ExecutivePortfolioDashboardState {
    if (!this.initializedAt) {
      throw new Error(
        "Executive Portfolio Dashboard not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const snapshot = this.controller.getManager().getLatestSnapshot();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRefreshes: performance.dashboardRefreshes,
      latestOverallScore: snapshot?.portfolioKpiSummary.overallKpiScore ?? 0,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EPD-001",
      missionId: "X2-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      latestSnapshot: snapshot,
      health,
      performance,
    };
  }

  connectExecutivePortfolioDashboard(
    input: ConnectExecutiveDashboardInput = {},
  ): DashboardRunReport {
    return this.controller.connectExecutivePortfolioDashboard(input);
  }

  refreshDashboard(input: RefreshDashboardInput = {}): DashboardRunReport {
    return this.controller.refreshDashboard(input);
  }

  aggregatePortfolioKpis(input: AggregatePortfolioKpisInput = {}): DashboardRunReport {
    return this.controller.aggregatePortfolioKpis(input);
  }

  generateExecutiveAlerts(input: GenerateExecutiveAlertsInput = {}): DashboardRunReport {
    return this.controller.generateExecutiveAlerts(input);
  }

  generateRecommendations(input: RecommendExecutiveInput = {}): DashboardRunReport {
    return this.controller.generateRecommendations(input);
  }

  drillDown(input: DrillDownInput): DashboardRunReport {
    return this.controller.drillDown(input);
  }

  runDiagnostics(input: RunDashboardDiagnosticsInput = {}): DashboardRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): DashboardRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestSnapshot() {
    return this.controller.getManager().getLatestSnapshot();
  }

  updateConfiguration(
    overrides: Partial<ExecutivePortfolioDashboardConfiguration>,
  ): ExecutivePortfolioDashboardState {
    const next = buildExecutivePortfolioDashboardConfiguration(this.bootstrap.repositoryRoot, {
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
        `Refreshes: ${state.health.totalRefreshes}`,
        `Latest KPI: ${state.health.latestOverallScore}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DashboardCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const snapshot = state.latestSnapshot;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      companiesTracked: snapshot?.companySummary.totalCompanies ?? 0,
      overallKpiScore: snapshot?.portfolioKpiSummary.overallKpiScore ?? 0,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0),
      recentLogs: getEpdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExecutivePortfolioDashboard(
  bootstrap: EmpireBootstrapContext,
  dependencies: ExecutivePortfolioDashboardDependencies,
  options?: ExecutivePortfolioDashboardOptions,
): ExecutivePortfolioDashboard {
  return new ExecutivePortfolioDashboard(bootstrap, dependencies, options);
}

export function resetExecutivePortfolioDashboardForTesting(): void {
  resetEpdLogsForTesting();
  new ExecutivePortfolioDashboardManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
