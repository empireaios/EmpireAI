import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCapitalDistributionEngineConfiguration,
  type CapitalDistributionEngineConfiguration,
} from "./configuration.js";
import { appendCdeLog, getCdeLogs, resetCdeLogsForTesting } from "./cde-logging.js";
import { CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AllocateCapitalInput,
  AnalyzeCapitalRiskInput,
  CapitalCockpitSnapshot,
  CapitalDistributionEngineState,
  CapitalRunReport,
  ConnectCapitalDistributionInput,
  EvaluateFundingInput,
  EvaluateOpportunityInput,
  ManageCapitalPoolInput,
  RankCapitalPrioritiesInput,
  RecommendCapitalInput,
  RunCapitalDiagnosticsInput,
} from "./types.js";
import { CapitalDistributionController } from "./capital-distribution-controller.js";
import {
  CapitalDistributionManager,
  type CapitalDistributionEngineDependencies,
} from "./capital-distribution-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CapitalDistributionEngineOptions {
  configuration?: Partial<CapitalDistributionEngineConfiguration>;
}

export type { CapitalDistributionEngineDependencies };

/**
 * Capital Distribution Engine (PILLOW-CDE-001 / X2-05).
 * Portfolio capital allocation — structural units only; never beyond approval policy.
 */
export class CapitalDistributionEngine {
  private initializedAt: string | null = null;
  private readonly controller: CapitalDistributionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CapitalDistributionEngineDependencies,
    options: CapitalDistributionEngineOptions = {},
  ) {
    const config = buildCapitalDistributionEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CapitalDistributionManager(dependencies);
    this.controller = new CapitalDistributionController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CapitalDistributionEngineState> {
    const doc = await this.reader.readText(CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Capital Distribution Engine")) {
      throw new Error(
        `${CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH} missing — Capital Distribution Engine requires X2-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCdeLog({
      event: "CAPITAL_DISTRIBUTION_ENGINE_ready",
      level: "info",
      details: "X2-05 Capital Distribution Engine initialized",
    });
    return this.getState();
  }

  getState(): CapitalDistributionEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Capital Distribution Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const allocations = this.controller.getManager().getAllocationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAllocationRecords: allocations.length,
      availablePoolUnits: this.controller.getManager().availablePoolUnits(),
      highRiskSignals: this.controller.getManager().highRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CDE-001",
      missionId: "X2-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCapitalDistributionEngine(
    input: ConnectCapitalDistributionInput = {},
  ): CapitalRunReport {
    return this.controller.connectCapitalDistributionEngine(input);
  }

  manageCapitalPool(input: ManageCapitalPoolInput): CapitalRunReport {
    return this.controller.manageCapitalPool(input);
  }

  evaluateFunding(input: EvaluateFundingInput): CapitalRunReport {
    return this.controller.evaluateFunding(input);
  }

  evaluateOpportunity(input: EvaluateOpportunityInput): CapitalRunReport {
    return this.controller.evaluateOpportunity(input);
  }

  allocateCapital(input: AllocateCapitalInput): CapitalRunReport {
    return this.controller.allocateCapital(input);
  }

  analyzeCapitalRisk(input: AnalyzeCapitalRiskInput = {}): CapitalRunReport {
    return this.controller.analyzeCapitalRisk(input);
  }

  rankCapitalPriorities(input: RankCapitalPrioritiesInput = {}): CapitalRunReport {
    return this.controller.rankCapitalPriorities(input);
  }

  generateRecommendations(input: RecommendCapitalInput = {}): CapitalRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunCapitalDiagnosticsInput = {}): CapitalRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): CapitalRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAllocationRecords() {
    return this.controller.getManager().getAllocationRecords();
  }

  getPoolRecords() {
    return this.controller.getManager().getPoolRecords();
  }

  updateConfiguration(
    overrides: Partial<CapitalDistributionEngineConfiguration>,
  ): CapitalDistributionEngineState {
    const next = buildCapitalDistributionEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Allocations: ${state.health.totalAllocationRecords}`,
        `Pool available: ${state.health.availablePoolUnits}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No capital operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CapitalCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalAllocationRecords: state.health.totalAllocationRecords,
      availablePoolUnits: state.health.availablePoolUnits,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0),
      recentLogs: getCdeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCapitalDistributionEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CapitalDistributionEngineDependencies,
  options?: CapitalDistributionEngineOptions,
): CapitalDistributionEngine {
  return new CapitalDistributionEngine(bootstrap, dependencies, options);
}

export function resetCapitalDistributionEngineForTesting(): void {
  resetCdeLogsForTesting();
  new CapitalDistributionManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
