import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCompanyFactoryFrameworkConfiguration,
  type CompanyFactoryFrameworkConfiguration,
} from "./configuration.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
  resetFrameworkLogsForTesting,
} from "./cff-logging.js";
import { COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractCompanyDataInput,
  FrameworkCockpitSnapshot,
  FrameworkRunReport,
  RegisterCompanyModuleInput,
  RouteCompanyEventInput,
  RunDiagnosticsInput,
  CompanyFactoryFrameworkState,
} from "./types.js";
import { CompanyFactoryFrameworkController } from "./company-factory-framework-controller.js";
import { CompanyFactoryFrameworkManager } from "./company-factory-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CompanyFactoryFrameworkEngineOptions {
  configuration?: Partial<CompanyFactoryFrameworkConfiguration>;
}

/**
 * Company Factory Framework (PILLOW-CFF-001 / X1-01).
 * Autonomous company creation architecture — framework only, no live company creation engines.
 */
export class CompanyFactoryFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: CompanyFactoryFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: CompanyFactoryFrameworkEngineOptions = {},
  ) {
    const config = buildCompanyFactoryFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CompanyFactoryFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CompanyFactoryFrameworkState> {
    const doc = await this.reader.readText(COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Company Factory Framework")) {
      throw new Error(
        `${COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH} missing — Company Factory Framework requires X1-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrameworkLog({
      event: "COMPANY_FACTORY_FRAMEWORK_ready",
      level: "info",
      details: "X1-01 Company Factory Framework initialized",
    });
    return this.getState();
  }

  getState(): CompanyFactoryFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Company Factory Framework not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const modules = this.controller.getManager().getModules();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      modules,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CFF-001",
      missionId: "X1-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      health,
      performance,
    };
  }

  registerCompanyModule(input: RegisterCompanyModuleInput): FrameworkRunReport {
    return this.controller.registerCompanyModule(input);
  }

  activateCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    return this.controller.activateCompanyModule(companyModuleIdentifier);
  }

  suspendCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    return this.controller.suspendCompanyModule(companyModuleIdentifier);
  }

  shutdownCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    return this.controller.shutdownCompanyModule(companyModuleIdentifier);
  }

  routeCompanyEvent(input: RouteCompanyEventInput): FrameworkRunReport {
    return this.controller.routeCompanyEvent(input);
  }

  abstractCompanyData(input: AbstractCompanyDataInput): FrameworkRunReport {
    return this.controller.abstractCompanyData(input);
  }

  runDiagnostics(input: RunDiagnosticsInput = {}): FrameworkRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): FrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredModules() {
    return this.controller.getManager().getModules();
  }

  updateConfiguration(
    overrides: Partial<CompanyFactoryFrameworkConfiguration>,
  ): CompanyFactoryFrameworkState {
    const next = buildCompanyFactoryFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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
        `Framework status: ${state.status}`,
        `Registered modules: ${state.registeredModules.length}`,
        `Active modules: ${state.health.activeModules}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No framework operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      registeredModuleCount: state.registeredModules.length,
      activeModuleCount: state.health.activeModules,
      totalEventsRouted: state.performance.totalEventsRouted,
      rateLimitedEvents: state.performance.rateLimitedEvents,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getFrameworkLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createCompanyFactoryFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: CompanyFactoryFrameworkEngineOptions,
): CompanyFactoryFrameworkEngine {
  return new CompanyFactoryFrameworkEngine(bootstrap, options);
}

export function resetCompanyFactoryFrameworkForTesting(): void {
  resetFrameworkLogsForTesting();
  new CompanyFactoryFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
