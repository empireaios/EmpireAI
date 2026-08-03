import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEnterpriseValueEngineConfiguration,
  type EnterpriseValueEngineConfiguration,
} from "./configuration.js";
import { appendEveLog, getEveLogs, resetEveLogsForTesting } from "./eve-logging.js";
import { SYSTEM_PATH } from "./paths.js";
import type {
  CalculateCompanyValuationInput,
  CalculateEnterpriseValueInput,
  CalculatePortfolioValuationInput,
  ConnectEnterpriseValueEngineInput,
  DetectValuationAnomaliesInput,
  EstimateIntrinsicValueInput,
  EstimateMarketValueInput,
  GenerateValuationRecommendationsInput,
  MeasureValueGrowthInput,
  RunValuationDiagnosticsInput,
  TrackValuationHistoryInput,
  ValuationCockpitSnapshot,
  ValuationRunReport,
  EnterpriseValueEngineState,
} from "./types.js";
import { EnterpriseValueController } from "./enterprise-value-controller.js";
import {
  EnterpriseValueManager,
  type EnterpriseValueEngineDependencies,
} from "./enterprise-value-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface EnterpriseValueEngineOptions {
  configuration?: Partial<EnterpriseValueEngineConfiguration>;
}

export type { EnterpriseValueEngineDependencies };

/**
 * Enterprise Value Engine (PILLOW-EVE-001 / X2-19).
 * Valuation governance — estimated values are structural signals, not guaranteed market prices.
 */
export class EnterpriseValueEngine {
  private initializedAt: string | null = null;
  private readonly controller: EnterpriseValueController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: EnterpriseValueEngineDependencies,
    options: EnterpriseValueEngineOptions = {},
  ) {
    const config = buildEnterpriseValueEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new EnterpriseValueManager(dependencies);
    this.controller = new EnterpriseValueController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EnterpriseValueEngineState> {
    const doc = await this.reader.readText(SYSTEM_PATH);
    if (!doc?.includes("Enterprise Value Engine")) {
      throw new Error(
        `${SYSTEM_PATH} missing — requires X2-19 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEveLog({
      event: "ENTERPRISE_VALUE_ENGINE_ready",
      level: "info",
      details: "X2-19 Enterprise Value Engine initialized — not guaranteed market prices",
    });
    return this.getState();
  }

  getState(): EnterpriseValueEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Enterprise Value Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const valuations = this.controller.getManager().getValuationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalValuationRecords: valuations.length,
      highConfidenceValuations: this.controller.getManager().highConfidenceCount(config),
      averageConfidenceScore: this.controller.getManager().averageConfidenceScore(),
      anomalyCount: this.controller.getManager().getAnomalyCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EVE-001",
      missionId: "X2-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectEnterpriseValueEngine(
    input: ConnectEnterpriseValueEngineInput = {},
  ): ValuationRunReport {
    return this.controller.connectEnterpriseValueEngine(input);
  }

  calculateEnterpriseValue(
    input: CalculateEnterpriseValueInput = {},
  ): ValuationRunReport {
    return this.controller.calculateEnterpriseValue(input);
  }

  calculateCompanyValuation(
    input: CalculateCompanyValuationInput = {},
  ): ValuationRunReport {
    return this.controller.calculateCompanyValuation(input);
  }

  calculatePortfolioValuation(
    input: CalculatePortfolioValuationInput = {},
  ): ValuationRunReport {
    return this.controller.calculatePortfolioValuation(input);
  }

  estimateIntrinsic(input: EstimateIntrinsicValueInput = {}): ValuationRunReport {
    return this.controller.estimateIntrinsic(input);
  }

  estimateMarket(input: EstimateMarketValueInput = {}): ValuationRunReport {
    return this.controller.estimateMarket(input);
  }

  measureValueGrowth(input: MeasureValueGrowthInput = {}): ValuationRunReport {
    return this.controller.measureValueGrowth(input);
  }

  trackHistory(input: TrackValuationHistoryInput = {}): ValuationRunReport {
    return this.controller.trackHistory(input);
  }

  detectAnomalies(input: DetectValuationAnomaliesInput = {}): ValuationRunReport {
    return this.controller.detectAnomalies(input);
  }

  generateRecommendations(
    input: GenerateValuationRecommendationsInput = {},
  ): ValuationRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunValuationDiagnosticsInput = {}): ValuationRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ValuationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getValuationRecords() {
    return this.controller.getManager().getValuationRecords();
  }

  getHistory() {
    return this.controller.getManager().getHistory();
  }

  updateConfiguration(
    overrides: Partial<EnterpriseValueEngineConfiguration>,
  ): EnterpriseValueEngineState {
    const next = buildEnterpriseValueEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Valuation records: ${state.health.totalValuationRecords}`,
        `High-confidence: ${state.health.highConfidenceValuations} · avg confidence: ${state.health.averageConfidenceScore}`,
        `Anomalies: ${state.health.anomalyCount}`,
        "Estimated values are not guaranteed market prices",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No valuation analyses yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ValuationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalValuationRecords: state.health.totalValuationRecords,
      highConfidenceValuations: state.health.highConfidenceValuations,
      averageConfidenceScore: state.health.averageConfidenceScore,
      anomalyCount: state.health.anomalyCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.portfolioForecastEngine ? 1 : 0) +
        (deps?.acquisitionEvaluationEngine ? 1 : 0) +
        (deps?.portfolioOptimizationEngine ? 1 : 0) +
        (deps?.portfolioExpansionPlanner ? 1 : 0),
      recentLogs: getEveLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createEnterpriseValueEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: EnterpriseValueEngineDependencies,
  options?: EnterpriseValueEngineOptions,
): EnterpriseValueEngine {
  return new EnterpriseValueEngine(bootstrap, dependencies, options);
}

export function resetEnterpriseValueEngineForTesting(): void {
  resetEveLogsForTesting();
  new EnterpriseValueManager({
    enterprisePortfolioFramework: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    businessHealthRanking: null,
    portfolioForecastEngine: null,
    acquisitionEvaluationEngine: null,
    portfolioOptimizationEngine: null,
    portfolioExpansionPlanner: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
