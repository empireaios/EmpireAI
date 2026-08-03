import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCompanyLifecycleManagerConfiguration,
  type CompanyLifecycleManagerConfiguration,
} from "./configuration.js";
import { appendClmLog, getClmLogs, resetClmLogsForTesting } from "./clm-logging.js";
import { COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  AssessMaturityInput,
  CompanyLifecycleManagerState,
  ConnectCompanyLifecycleManagerInput,
  DetectTransitionsInput,
  GenerateLifecycleRecommendationsInput,
  LifecycleCockpitSnapshot,
  LifecycleRunReport,
  ManageLifecycleStageInput,
  ManageStageActionInput,
  RunLifecycleAnalyticsInput,
  RunLifecycleDiagnosticsInput,
} from "./types.js";
import { CompanyLifecycleController } from "./company-lifecycle-controller.js";
import {
  CompanyLifecycleManagerCore,
  type CompanyLifecycleManagerDependencies,
} from "./company-lifecycle-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CompanyLifecycleManagerOptions {
  configuration?: Partial<CompanyLifecycleManagerConfiguration>;
}

export type { CompanyLifecycleManagerDependencies };

/**
 * Company Lifecycle Manager (PILLOW-CLM-001 / X2-17).
 * Lifecycle governance — stages recommended only; auto-transition blocked beyond approval policies.
 */
export class CompanyLifecycleManager {
  private initializedAt: string | null = null;
  private readonly controller: CompanyLifecycleController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CompanyLifecycleManagerDependencies,
    options: CompanyLifecycleManagerOptions = {},
  ) {
    const config = buildCompanyLifecycleManagerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CompanyLifecycleManagerCore(dependencies);
    this.controller = new CompanyLifecycleController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CompanyLifecycleManagerState> {
    const doc = await this.reader.readText(COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH);
    if (!doc?.includes("Company Lifecycle Manager")) {
      throw new Error(
        `${COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH} missing — requires X2-17 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendClmLog({
      event: "COMPANY_LIFECYCLE_MANAGER_ready",
      level: "info",
      details: "X2-17 Company Lifecycle Manager initialized",
    });
    return this.getState();
  }

  getState(): CompanyLifecycleManagerState {
    if (!this.initializedAt) {
      throw new Error("Company Lifecycle Manager not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const lifecycles = this.controller.getManager().getLifecycleRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLifecycleRecords: lifecycles.length,
      pendingTransitions: this.controller.getManager().pendingTransitionCount(),
      averageMaturityScore: this.controller.getManager().averageMaturityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CLM-001",
      missionId: "X2-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCompanyLifecycleManager(
    input: ConnectCompanyLifecycleManagerInput = {},
  ): LifecycleRunReport {
    return this.controller.connectCompanyLifecycleManager(input);
  }

  manageStage(input: ManageLifecycleStageInput): LifecycleRunReport {
    return this.controller.manageStage(input);
  }

  assessMaturity(input: AssessMaturityInput): LifecycleRunReport {
    return this.controller.assessMaturity(input);
  }

  detectTransitions(input: DetectTransitionsInput = {}): LifecycleRunReport {
    return this.controller.detectTransitions(input);
  }

  manageLaunch(input: ManageStageActionInput): LifecycleRunReport {
    return this.controller.manageLaunch(input);
  }

  manageGrowth(input: ManageStageActionInput): LifecycleRunReport {
    return this.controller.manageGrowth(input);
  }

  manageMature(input: ManageStageActionInput): LifecycleRunReport {
    return this.controller.manageMature(input);
  }

  manageRetirement(input: ManageStageActionInput): LifecycleRunReport {
    return this.controller.manageRetirement(input);
  }

  generateRecommendations(
    input: GenerateLifecycleRecommendationsInput = {},
  ): LifecycleRunReport {
    return this.controller.generateRecommendations(input);
  }

  runAnalytics(input: RunLifecycleAnalyticsInput = {}): LifecycleRunReport {
    return this.controller.runAnalytics(input);
  }

  runDiagnostics(input: RunLifecycleDiagnosticsInput = {}): LifecycleRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): LifecycleRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLifecycleRecords() {
    return this.controller.getManager().getLifecycleRecords();
  }

  updateConfiguration(
    overrides: Partial<CompanyLifecycleManagerConfiguration>,
  ): CompanyLifecycleManagerState {
    const next = buildCompanyLifecycleManagerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Lifecycle records: ${state.health.totalLifecycleRecords}`,
        `Pending transitions: ${state.health.pendingTransitions} · avg maturity: ${state.health.averageMaturityScore}`,
        "Automatic lifecycle transitions blocked beyond approval policies",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No lifecycle operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LifecycleCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalLifecycleRecords: state.health.totalLifecycleRecords,
      pendingTransitions: state.health.pendingTransitions,
      averageMaturityScore: state.health.averageMaturityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.portfolioForecastEngine ? 1 : 0) +
        (deps?.portfolioOptimizationEngine ? 1 : 0),
      recentLogs: getClmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCompanyLifecycleManager(
  bootstrap: EmpireBootstrapContext,
  dependencies: CompanyLifecycleManagerDependencies,
  options?: CompanyLifecycleManagerOptions,
): CompanyLifecycleManager {
  return new CompanyLifecycleManager(bootstrap, dependencies, options);
}

export function resetCompanyLifecycleManagerForTesting(): void {
  resetClmLogsForTesting();
  new CompanyLifecycleManagerCore({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    businessHealthRanking: null,
    portfolioForecastEngine: null,
    portfolioOptimizationEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
