import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCrossCompanyResourceEngineConfiguration,
  type CrossCompanyResourceEngineConfiguration,
} from "./configuration.js";
import { appendCcreLog, getCcreLogs, resetCcreLogsForTesting } from "./ccre-logging.js";
import { CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AllocateResourceInput,
  ConnectCrossCompanyResourceInput,
  CrossCompanyResourceEngineState,
  DetectIdleResourcesInput,
  DetectResourceConflictsInput,
  OptimizeResourcesInput,
  RecommendResourceInput,
  RegisterResourceInput,
  ResourceCockpitSnapshot,
  ResourceRunReport,
  RunResourceDiagnosticsInput,
} from "./types.js";
import { CrossCompanyResourceController } from "./cross-company-resource-controller.js";
import {
  CrossCompanyResourceManager,
  type CrossCompanyResourceEngineDependencies,
} from "./cross-company-resource-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CrossCompanyResourceEngineOptions {
  configuration?: Partial<CrossCompanyResourceEngineConfiguration>;
}

export type { CrossCompanyResourceEngineDependencies };

/**
 * Cross-Company Resource Engine (PILLOW-CCRE-001 / X2-11).
 * Shared resource allocation — structural signals only; never allocate protected without auth.
 */
export class CrossCompanyResourceEngine {
  private initializedAt: string | null = null;
  private readonly controller: CrossCompanyResourceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CrossCompanyResourceEngineDependencies,
    options: CrossCompanyResourceEngineOptions = {},
  ) {
    const config = buildCrossCompanyResourceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CrossCompanyResourceManager(dependencies);
    this.controller = new CrossCompanyResourceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CrossCompanyResourceEngineState> {
    const doc = await this.reader.readText(CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Cross-Company Resource Engine")) {
      throw new Error(
        `${CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH} missing — requires X2-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCcreLog({
      event: "CROSS_COMPANY_RESOURCE_ENGINE_ready",
      level: "info",
      details: "X2-11 Cross-Company Resource Engine initialized",
    });
    return this.getState();
  }

  getState(): CrossCompanyResourceEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Cross-Company Resource Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const resources = this.controller.getManager().getResourceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalResourceRecords: resources.length,
      idleResources: this.controller.getManager().idleCount(),
      conflictCount: this.controller.getManager().conflictCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CCRE-001",
      missionId: "X2-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCrossCompanyResourceEngine(
    input: ConnectCrossCompanyResourceInput = {},
  ): ResourceRunReport {
    return this.controller.connectCrossCompanyResourceEngine(input);
  }

  registerResource(input: RegisterResourceInput): ResourceRunReport {
    return this.controller.registerResource(input);
  }

  allocateResource(input: AllocateResourceInput): ResourceRunReport {
    return this.controller.allocateResource(input);
  }

  detectIdleResources(input: DetectIdleResourcesInput = {}): ResourceRunReport {
    return this.controller.detectIdleResources(input);
  }

  detectConflicts(input: DetectResourceConflictsInput = {}): ResourceRunReport {
    return this.controller.detectConflicts(input);
  }

  optimizeResources(input: OptimizeResourcesInput = {}): ResourceRunReport {
    return this.controller.optimizeResources(input);
  }

  generateRecommendations(input: RecommendResourceInput = {}): ResourceRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunResourceDiagnosticsInput = {}): ResourceRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ResourceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getResourceRecords() {
    return this.controller.getManager().getResourceRecords();
  }

  updateConfiguration(
    overrides: Partial<CrossCompanyResourceEngineConfiguration>,
  ): CrossCompanyResourceEngineState {
    const next = buildCrossCompanyResourceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Resources: ${state.health.totalResourceRecords}`,
        `Idle: ${state.health.idleResources} · conflicts: ${state.health.conflictCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No resource operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ResourceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalResourceRecords: state.health.totalResourceRecords,
      idleResources: state.health.idleResources,
      conflictCount: state.health.conflictCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.crossBusinessKnowledgeEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.portfolioIntelligenceCertified ? 1 : 0),
      recentLogs: getCcreLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCrossCompanyResourceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CrossCompanyResourceEngineDependencies,
  options?: CrossCompanyResourceEngineOptions,
): CrossCompanyResourceEngine {
  return new CrossCompanyResourceEngine(bootstrap, dependencies, options);
}

export function resetCrossCompanyResourceEngineForTesting(): void {
  resetCcreLogsForTesting();
  new CrossCompanyResourceManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
    crossBusinessKnowledgeEngine: null,
    capitalDistributionEngine: null,
    portfolioIntelligenceCertified: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
