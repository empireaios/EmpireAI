import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioRiskEngineConfiguration,
  type PortfolioRiskEngineConfiguration,
} from "./configuration.js";
import { appendPreLog, getPreLogs, resetPreLogsForTesting } from "./pre-logging.js";
import { PORTFOLIO_RISK_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeFinancialRiskInput,
  AnalyzeOperationalRiskInput,
  ConnectPortfolioRiskInput,
  DetectEmergingRisksInput,
  MonitorRisksInput,
  PortfolioRiskEngineState,
  RecommendRiskMitigationInput,
  RiskCockpitSnapshot,
  RiskRunReport,
  RunRiskDiagnosticsInput,
  ScorePortfolioRiskInput,
} from "./types.js";
import { PortfolioRiskController } from "./portfolio-risk-controller.js";
import {
  PortfolioRiskManager,
  type PortfolioRiskEngineDependencies,
} from "./portfolio-risk-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioRiskEngineOptions {
  configuration?: Partial<PortfolioRiskEngineConfiguration>;
}

export type { PortfolioRiskEngineDependencies };

/**
 * Portfolio Risk Engine (PILLOW-PRE-001 / X2-07).
 * Enterprise portfolio risk management — continuous structural risk monitoring.
 */
export class PortfolioRiskEngine {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioRiskController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioRiskEngineDependencies,
    options: PortfolioRiskEngineOptions = {},
  ) {
    const config = buildPortfolioRiskEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioRiskManager(dependencies);
    this.controller = new PortfolioRiskController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioRiskEngineState> {
    const doc = await this.reader.readText(PORTFOLIO_RISK_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Risk Engine")) {
      throw new Error(
        `${PORTFOLIO_RISK_ENGINE_SYSTEM_PATH} missing — Portfolio Risk Engine requires X2-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPreLog({
      event: "PORTFOLIO_RISK_ENGINE_ready",
      level: "info",
      details: "X2-07 Portfolio Risk Engine initialized",
    });
    return this.getState();
  }

  getState(): PortfolioRiskEngineState {
    if (!this.initializedAt) {
      throw new Error("Portfolio Risk Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const risks = this.controller.getManager().getRiskRecords();
    const summary = this.controller.getManager().getScoreSummary();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRiskRecords: risks.length,
      criticalRiskCount: this.controller.getManager().criticalRiskCount(),
      latestPortfolioRiskScore: summary?.overallPortfolioRiskScore ?? 0,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PRE-001",
      missionId: "X2-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioRiskEngine(input: ConnectPortfolioRiskInput = {}): RiskRunReport {
    return this.controller.connectPortfolioRiskEngine(input);
  }

  monitorRisks(input: MonitorRisksInput = {}): RiskRunReport {
    return this.controller.monitorRisks(input);
  }

  analyzeFinancialRisk(input: AnalyzeFinancialRiskInput = {}): RiskRunReport {
    return this.controller.analyzeFinancialRisk(input);
  }

  analyzeOperationalRisk(input: AnalyzeOperationalRiskInput = {}): RiskRunReport {
    return this.controller.analyzeOperationalRisk(input);
  }

  scorePortfolioRisk(input: ScorePortfolioRiskInput = {}): RiskRunReport {
    return this.controller.scorePortfolioRisk(input);
  }

  detectEmergingRisks(input: DetectEmergingRisksInput = {}): RiskRunReport {
    return this.controller.detectEmergingRisks(input);
  }

  generateRecommendations(input: RecommendRiskMitigationInput = {}): RiskRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunRiskDiagnosticsInput = {}): RiskRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RiskRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRiskRecords() {
    return this.controller.getManager().getRiskRecords();
  }

  getScoreSummary() {
    return this.controller.getManager().getScoreSummary();
  }

  updateConfiguration(
    overrides: Partial<PortfolioRiskEngineConfiguration>,
  ): PortfolioRiskEngineState {
    const next = buildPortfolioRiskEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Risks: ${state.health.totalRiskRecords}`,
        `Critical: ${state.health.criticalRiskCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No risk operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RiskCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;
    const summary = this.controller.getManager().getScoreSummary();

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalRiskRecords: state.health.totalRiskRecords,
      criticalRiskCount: state.health.criticalRiskCount,
      overallPortfolioRiskScore: summary?.overallPortfolioRiskScore ?? 0,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0),
      recentLogs: getPreLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioRiskEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioRiskEngineDependencies,
  options?: PortfolioRiskEngineOptions,
): PortfolioRiskEngine {
  return new PortfolioRiskEngine(bootstrap, dependencies, options);
}

export function resetPortfolioRiskEngineForTesting(): void {
  resetPreLogsForTesting();
  new PortfolioRiskManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
