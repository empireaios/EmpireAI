import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAcquisitionEvaluationEngineConfiguration,
  type AcquisitionEvaluationEngineConfiguration,
} from "./configuration.js";
import { appendAeeLog, getAeeLogs, resetAeeLogsForTesting } from "./aee-logging.js";
import { ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AcquisitionCockpitSnapshot,
  AcquisitionEvaluationEngineState,
  AcquisitionRunReport,
  ConnectAcquisitionEvaluationEngineInput,
  DiscoverAcquisitionCandidatesInput,
  EvaluateAcquisitionInput,
  GenerateAcquisitionRecommendationsInput,
  RankAcquisitionOpportunitiesInput,
  RunAcquisitionDiagnosticsInput,
} from "./types.js";
import { AcquisitionEvaluationController } from "./acquisition-evaluation-controller.js";
import {
  AcquisitionEvaluationManager,
  type AcquisitionEvaluationEngineDependencies,
} from "./acquisition-evaluation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AcquisitionEvaluationEngineOptions {
  configuration?: Partial<AcquisitionEvaluationEngineConfiguration>;
}

export type { AcquisitionEvaluationEngineDependencies };

/**
 * Acquisition Evaluation Engine (PILLOW-AEE-001 / X2-15).
 * Acquisition intelligence — validated information only.
 */
export class AcquisitionEvaluationEngine {
  private initializedAt: string | null = null;
  private readonly controller: AcquisitionEvaluationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AcquisitionEvaluationEngineDependencies,
    options: AcquisitionEvaluationEngineOptions = {},
  ) {
    const config = buildAcquisitionEvaluationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AcquisitionEvaluationManager(dependencies);
    this.controller = new AcquisitionEvaluationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AcquisitionEvaluationEngineState> {
    const doc = await this.reader.readText(ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Acquisition Evaluation Engine")) {
      throw new Error(
        `${ACQUISITION_EVALUATION_ENGINE_SYSTEM_PATH} missing — requires X2-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAeeLog({
      event: "ACQUISITION_EVALUATION_ENGINE_ready",
      level: "info",
      details: "X2-15 Acquisition Evaluation Engine initialized",
    });
    return this.getState();
  }

  getState(): AcquisitionEvaluationEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Acquisition Evaluation Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const acquisitions = this.controller.getManager().getAcquisitionRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAcquisitionRecords: acquisitions.length,
      pursueRecommendations: this.controller.getManager().pursueCount(),
      averageStrategicFit: this.controller.getManager().averageStrategicFit(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AEE-001",
      missionId: "X2-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAcquisitionEvaluationEngine(
    input: ConnectAcquisitionEvaluationEngineInput = {},
  ): AcquisitionRunReport {
    return this.controller.connectAcquisitionEvaluationEngine(input);
  }

  discoverCandidates(input: DiscoverAcquisitionCandidatesInput = {}): AcquisitionRunReport {
    return this.controller.discoverCandidates(input);
  }

  evaluateOpportunity(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.evaluateOpportunity(input);
  }

  evaluateStrategicFit(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.evaluateStrategicFit(input);
  }

  evaluateFinancial(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.evaluateFinancial(input);
  }

  evaluateOperationalMaturity(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.evaluateOperationalMaturity(input);
  }

  evaluateRisks(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.evaluateRisks(input);
  }

  estimateValue(input: EvaluateAcquisitionInput): AcquisitionRunReport {
    return this.controller.estimateValue(input);
  }

  rankOpportunities(input: RankAcquisitionOpportunitiesInput = {}): AcquisitionRunReport {
    return this.controller.rankOpportunities(input);
  }

  generateRecommendations(
    input: GenerateAcquisitionRecommendationsInput = {},
  ): AcquisitionRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunAcquisitionDiagnosticsInput = {}): AcquisitionRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): AcquisitionRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAcquisitionRecords() {
    return this.controller.getManager().getAcquisitionRecords();
  }

  updateConfiguration(
    overrides: Partial<AcquisitionEvaluationEngineConfiguration>,
  ): AcquisitionEvaluationEngineState {
    const next = buildAcquisitionEvaluationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Acquisition records: ${state.health.totalAcquisitionRecords}`,
        `Pursue: ${state.health.pursueRecommendations} · avg strategic fit: ${state.health.averageStrategicFit}`,
        "Recommendations require validated information only",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No acquisition evaluations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AcquisitionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalAcquisitionRecords: state.health.totalAcquisitionRecords,
      pursueRecommendations: state.health.pursueRecommendations,
      averageStrategicFit: state.health.averageStrategicFit,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.sharedSupplierIntelligence ? 1 : 0) +
        (deps?.portfolioForecastEngine ? 1 : 0),
      recentLogs: getAeeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAcquisitionEvaluationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AcquisitionEvaluationEngineDependencies,
  options?: AcquisitionEvaluationEngineOptions,
): AcquisitionEvaluationEngine {
  return new AcquisitionEvaluationEngine(bootstrap, dependencies, options);
}

export function resetAcquisitionEvaluationEngineForTesting(): void {
  resetAeeLogsForTesting();
  new AcquisitionEvaluationManager({
    enterprisePortfolioFramework: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    portfolioRiskEngine: null,
    businessHealthRanking: null,
    sharedSupplierIntelligence: null,
    portfolioForecastEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
