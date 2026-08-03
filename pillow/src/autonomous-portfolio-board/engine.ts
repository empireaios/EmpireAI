/** X2-20 — Autonomous Portfolio Board engine facade. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousPortfolioBoardConfiguration,
  type AutonomousPortfolioBoardConfiguration,
} from "./configuration.js";
import { appendApbLog, getApbLogs, resetApbLogsForTesting } from "./apb-logging.js";
import { SYSTEM_PATH } from "./paths.js";
import type {
  AutonomousPortfolioBoardState,
  ConnectAutonomousPortfolioBoardInput,
  ExecutiveBoardCockpitSnapshot,
  ExecutiveBoardRunReport,
  GenerateExecutiveRecommendationsInput,
  PrioritizeExecutiveDecisionsInput,
  ReviewAcquisitionOpportunitiesInput,
  ReviewCapitalAllocationInput,
  ReviewEnterprisePerformanceInput,
  ReviewEnterpriseRisksInput,
  ReviewExpansionOpportunitiesInput,
  ReviewPortfolioHealthInput,
  ReviewStrategicOpportunitiesInput,
  RunExecutiveBoardDiagnosticsInput,
} from "./types.js";
import { AutonomousPortfolioBoardController } from "./autonomous-portfolio-board-controller.js";
import {
  AutonomousPortfolioBoardManager,
  type AutonomousPortfolioBoardDependencies,
} from "./autonomous-portfolio-board-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AutonomousPortfolioBoardOptions {
  configuration?: Partial<AutonomousPortfolioBoardConfiguration>;
}

export type { AutonomousPortfolioBoardDependencies };

/**
 * Autonomous Portfolio Board (PILLOW-APB-001 / X2-20).
 * Executive decision support — strategic decisions never auto-execute beyond approval policies.
 */
export class AutonomousPortfolioBoard {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousPortfolioBoardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AutonomousPortfolioBoardDependencies,
    options: AutonomousPortfolioBoardOptions = {},
  ) {
    const config = buildAutonomousPortfolioBoardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AutonomousPortfolioBoardManager(dependencies);
    this.controller = new AutonomousPortfolioBoardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousPortfolioBoardState> {
    const doc = await this.reader.readText(SYSTEM_PATH);
    if (!doc?.includes("Autonomous Portfolio Board")) {
      throw new Error(`${SYSTEM_PATH} missing — requires X2-20 system doc.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendApbLog({
      event: "AUTONOMOUS_PORTFOLIO_BOARD_ready",
      level: "info",
      details:
        "X2-20 Autonomous Portfolio Board initialized — strategic decisions never auto-execute beyond approval policies",
    });
    return this.getState();
  }

  getState(): AutonomousPortfolioBoardState {
    if (!this.initializedAt) {
      throw new Error(
        "Autonomous Portfolio Board not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const boardRecords = this.controller.getManager().getBoardRecords();
    const recommendations = this.controller.getManager().getRecommendations();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBoardRecords: boardRecords.length,
      highConfidenceDecisions: this.controller.getManager().highConfidenceCount(config),
      averageDecisionConfidence: this.controller.getManager().averageDecisionConfidence(),
      recommendationCount: recommendations.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-APB-001",
      missionId: "X2-20",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAutonomousPortfolioBoard(
    input: ConnectAutonomousPortfolioBoardInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.connectAutonomousPortfolioBoard(input);
  }

  reviewEnterprisePerformance(
    input: ReviewEnterprisePerformanceInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.reviewEnterprisePerformance(input);
  }

  reviewPortfolioHealth(input: ReviewPortfolioHealthInput = {}): ExecutiveBoardRunReport {
    return this.controller.reviewPortfolioHealth(input);
  }

  reviewStrategicOpportunities(
    input: ReviewStrategicOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.reviewStrategicOpportunities(input);
  }

  reviewEnterpriseRisks(input: ReviewEnterpriseRisksInput = {}): ExecutiveBoardRunReport {
    return this.controller.reviewEnterpriseRisks(input);
  }

  reviewCapitalAllocation(input: ReviewCapitalAllocationInput = {}): ExecutiveBoardRunReport {
    return this.controller.reviewCapitalAllocation(input);
  }

  reviewExpansionOpportunities(
    input: ReviewExpansionOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.reviewExpansionOpportunities(input);
  }

  reviewAcquisitionOpportunities(
    input: ReviewAcquisitionOpportunitiesInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.reviewAcquisitionOpportunities(input);
  }

  prioritizeExecutiveDecisions(
    input: PrioritizeExecutiveDecisionsInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.prioritizeExecutiveDecisions(input);
  }

  generateExecutiveRecommendations(
    input: GenerateExecutiveRecommendationsInput = {},
  ): ExecutiveBoardRunReport {
    return this.controller.generateExecutiveRecommendations(input);
  }

  runDiagnostics(input: RunExecutiveBoardDiagnosticsInput = {}): ExecutiveBoardRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ExecutiveBoardRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBoardRecords() {
    return this.controller.getManager().getBoardRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<AutonomousPortfolioBoardConfiguration>,
  ): AutonomousPortfolioBoardState {
    const next = buildAutonomousPortfolioBoardConfiguration(this.bootstrap.repositoryRoot, {
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
        `Board records: ${state.health.totalBoardRecords}`,
        `High-confidence: ${state.health.highConfidenceDecisions} · avg confidence: ${state.health.averageDecisionConfidence}`,
        `Recommendations: ${state.health.recommendationCount}`,
        "Strategic decisions never auto-execute beyond approval policies",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No executive board analyses yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveBoardCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBoardRecords: state.health.totalBoardRecords,
      highConfidenceDecisions: state.health.highConfidenceDecisions,
      averageDecisionConfidence: state.health.averageDecisionConfidence,
      recommendationCount: state.health.recommendationCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.portfolioForecastEngine ? 1 : 0) +
        (deps?.acquisitionEvaluationEngine ? 1 : 0) +
        (deps?.portfolioOptimizationEngine ? 1 : 0) +
        (deps?.companyLifecycleManager ? 1 : 0) +
        (deps?.portfolioExpansionPlanner ? 1 : 0) +
        (deps?.enterpriseValueEngine ? 1 : 0),
      recentLogs: getApbLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAutonomousPortfolioBoard(
  bootstrap: EmpireBootstrapContext,
  dependencies: AutonomousPortfolioBoardDependencies,
  options?: AutonomousPortfolioBoardOptions,
): AutonomousPortfolioBoard {
  return new AutonomousPortfolioBoard(bootstrap, dependencies, options);
}

export function resetAutonomousPortfolioBoardForTesting(): void {
  resetApbLogsForTesting();
  new AutonomousPortfolioBoardManager({
    enterprisePortfolioFramework: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    businessHealthRanking: null,
    portfolioForecastEngine: null,
    acquisitionEvaluationEngine: null,
    portfolioOptimizationEngine: null,
    companyLifecycleManager: null,
    portfolioExpansionPlanner: null,
    enterpriseValueEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
