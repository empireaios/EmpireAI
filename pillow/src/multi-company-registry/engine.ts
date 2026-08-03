import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMultiCompanyRegistryConfiguration,
  type MultiCompanyRegistryConfiguration,
} from "./configuration.js";
import { appendMcrLog, getMcrLogs, resetMcrLogsForTesting } from "./mcr-logging.js";
import { MULTI_COMPANY_REGISTRY_SYSTEM_PATH } from "./paths.js";
import type {
  AdvanceLifecycleInput,
  ClassifyCompanyInput,
  ConnectMultiCompanyRegistryInput,
  DetectDuplicatesInput,
  MultiCompanyRegistryState,
  RecommendRegistryInput,
  RegisterCompanyInput,
  RegistryCockpitSnapshot,
  RegistryRunReport,
  RunRegistryDiagnosticsInput,
  UpdateCompanyProfileInput,
  UpdateOwnershipInput,
} from "./types.js";
import { MultiCompanyRegistryController } from "./multi-company-registry-controller.js";
import {
  MultiCompanyRegistryManager,
  type MultiCompanyRegistryDependencies,
} from "./multi-company-registry-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MultiCompanyRegistryOptions {
  configuration?: Partial<MultiCompanyRegistryConfiguration>;
}

export type { MultiCompanyRegistryDependencies };

/**
 * Multi-Company Registry (PILLOW-MCR-001 / X2-02).
 * Centralized company registration and portfolio visibility — registration only.
 */
export class MultiCompanyRegistry {
  private initializedAt: string | null = null;
  private readonly controller: MultiCompanyRegistryController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: MultiCompanyRegistryDependencies,
    options: MultiCompanyRegistryOptions = {},
  ) {
    const config = buildMultiCompanyRegistryConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MultiCompanyRegistryManager(dependencies);
    this.controller = new MultiCompanyRegistryController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MultiCompanyRegistryState> {
    const doc = await this.reader.readText(MULTI_COMPANY_REGISTRY_SYSTEM_PATH);
    if (!doc?.includes("Multi-Company Registry")) {
      throw new Error(
        `${MULTI_COMPANY_REGISTRY_SYSTEM_PATH} missing — Multi-Company Registry requires X2-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMcrLog({
      event: "MULTI_COMPANY_REGISTRY_ready",
      level: "info",
      details: "X2-02 Multi-Company Registry initialized",
    });
    return this.getState();
  }

  getState(): MultiCompanyRegistryState {
    if (!this.initializedAt) {
      throw new Error("Multi-Company Registry not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const companies = this.controller.getManager().getCompanyRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCompanyRecords: companies.length,
      activeCompanies: this.controller.getManager().activeCompanyCount(),
      duplicateSignals: this.controller.getManager().duplicateSignalCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MCR-001",
      missionId: "X2-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMultiCompanyRegistry(
    input: ConnectMultiCompanyRegistryInput = {},
  ): RegistryRunReport {
    return this.controller.connectMultiCompanyRegistry(input);
  }

  registerCompany(input: RegisterCompanyInput): RegistryRunReport {
    return this.controller.registerCompany(input);
  }

  updateProfile(input: UpdateCompanyProfileInput): RegistryRunReport {
    return this.controller.updateProfile(input);
  }

  updateOwnership(input: UpdateOwnershipInput): RegistryRunReport {
    return this.controller.updateOwnership(input);
  }

  classifyCompany(input: ClassifyCompanyInput): RegistryRunReport {
    return this.controller.classifyCompany(input);
  }

  advanceLifecycle(input: AdvanceLifecycleInput): RegistryRunReport {
    return this.controller.advanceLifecycle(input);
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): RegistryRunReport {
    return this.controller.detectDuplicates(input);
  }

  generateRecommendations(input: RecommendRegistryInput = {}): RegistryRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunRegistryDiagnosticsInput = {}): RegistryRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RegistryRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCompanyRecords() {
    return this.controller.getManager().getCompanyRecords();
  }

  updateConfiguration(
    overrides: Partial<MultiCompanyRegistryConfiguration>,
  ): MultiCompanyRegistryState {
    const next = buildMultiCompanyRegistryConfiguration(this.bootstrap.repositoryRoot, {
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
        `Registry status: ${state.status}`,
        `Companies: ${state.health.totalCompanyRecords}`,
        `Active: ${state.health.activeCompanies}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No registry operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RegistryCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCompanyRecords: state.health.totalCompanyRecords,
      activeCompanies: state.health.activeCompanies,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: record?.dependencyPresence.enterprisePortfolioFramework ? 1 : 0,
      recentLogs: getMcrLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMultiCompanyRegistry(
  bootstrap: EmpireBootstrapContext,
  dependencies: MultiCompanyRegistryDependencies,
  options?: MultiCompanyRegistryOptions,
): MultiCompanyRegistry {
  return new MultiCompanyRegistry(bootstrap, dependencies, options);
}

export function resetMultiCompanyRegistryForTesting(): void {
  resetMcrLogsForTesting();
  new MultiCompanyRegistryManager({ enterprisePortfolioFramework: null }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
