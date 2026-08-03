import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessHealthRankingConfiguration,
  type BusinessHealthRankingConfiguration,
} from "./configuration.js";
import { appendBhrLog, getBhrLogs, resetBhrLogsForTesting } from "./bhr-logging.js";
import { BUSINESS_HEALTH_RANKING_SYSTEM_PATH } from "./paths.js";
import type {
  BusinessHealthRunReport,
  BusinessHealthRankingState,
  ConnectBusinessHealthRankingInput,
  DetectDecliningInput,
  DetectHighPerformingInput,
  GeneratePrioritiesInput,
  MeasureBusinessHealthInput,
  RankCompaniesInput,
  RankingCockpitSnapshot,
  RunRankingDiagnosticsInput,
} from "./types.js";
import { BusinessHealthRankingController } from "./business-health-ranking-controller.js";
import {
  BusinessHealthRankingManager,
  type BusinessHealthRankingDependencies,
} from "./business-health-ranking-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface BusinessHealthRankingOptions {
  configuration?: Partial<BusinessHealthRankingConfiguration>;
}

export type { BusinessHealthRankingDependencies };

/**
 * Business Health Ranking (PILLOW-BHR-001 / X2-09).
 * Company ranking to prioritize management attention.
 */
export class BusinessHealthRanking {
  private initializedAt: string | null = null;
  private readonly controller: BusinessHealthRankingController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BusinessHealthRankingDependencies,
    options: BusinessHealthRankingOptions = {},
  ) {
    const config = buildBusinessHealthRankingConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BusinessHealthRankingManager(dependencies);
    this.controller = new BusinessHealthRankingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BusinessHealthRankingState> {
    const doc = await this.reader.readText(BUSINESS_HEALTH_RANKING_SYSTEM_PATH);
    if (!doc?.includes("Business Health Ranking")) {
      throw new Error(
        `${BUSINESS_HEALTH_RANKING_SYSTEM_PATH} missing — Business Health Ranking requires X2-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBhrLog({
      event: "BUSINESS_HEALTH_RANKING_ready",
      level: "info",
      details: "X2-09 Business Health Ranking initialized",
    });
    return this.getState();
  }

  getState(): BusinessHealthRankingState {
    if (!this.initializedAt) {
      throw new Error("Business Health Ranking not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalHealthRecords: this.controller.getManager().getHealthRecords().length,
      decliningCount: this.controller.getManager().decliningCount(),
      highPerformingCount: this.controller.getManager().highPerformingCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BHR-001",
      missionId: "X2-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBusinessHealthRanking(
    input: ConnectBusinessHealthRankingInput = {},
  ): BusinessHealthRunReport {
    return this.controller.connectBusinessHealthRanking(input);
  }

  measureBusinessHealth(input: MeasureBusinessHealthInput = {}): BusinessHealthRunReport {
    return this.controller.measureBusinessHealth(input);
  }

  rankCompanies(input: RankCompaniesInput = {}): BusinessHealthRunReport {
    return this.controller.rankCompanies(input);
  }

  detectDeclining(input: DetectDecliningInput = {}): BusinessHealthRunReport {
    return this.controller.detectDeclining(input);
  }

  detectHighPerforming(input: DetectHighPerformingInput = {}): BusinessHealthRunReport {
    return this.controller.detectHighPerforming(input);
  }

  generatePriorities(input: GeneratePrioritiesInput = {}): BusinessHealthRunReport {
    return this.controller.generatePriorities(input);
  }

  runDiagnostics(input: RunRankingDiagnosticsInput = {}): BusinessHealthRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): BusinessHealthRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getHealthRecords() {
    return this.controller.getManager().getHealthRecords();
  }

  updateConfiguration(
    overrides: Partial<BusinessHealthRankingConfiguration>,
  ): BusinessHealthRankingState {
    const next = buildBusinessHealthRankingConfiguration(this.bootstrap.repositoryRoot, {
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
        `Health records: ${state.health.totalHealthRecords}`,
        `Declining: ${state.health.decliningCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No ranking operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RankingCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalHealthRecords: state.health.totalHealthRecords,
      decliningCount: state.health.decliningCount,
      highPerformingCount: state.health.highPerformingCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.executivePortfolioDashboard ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.portfolioBalanceEngine ? 1 : 0),
      recentLogs: getBhrLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBusinessHealthRanking(
  bootstrap: EmpireBootstrapContext,
  dependencies: BusinessHealthRankingDependencies,
  options?: BusinessHealthRankingOptions,
): BusinessHealthRanking {
  return new BusinessHealthRanking(bootstrap, dependencies, options);
}

export function resetBusinessHealthRankingForTesting(): void {
  resetBhrLogsForTesting();
  new BusinessHealthRankingManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    executivePortfolioDashboard: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
