import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEnterprisePortfolioFrameworkConfiguration,
  type EnterprisePortfolioFrameworkConfiguration,
} from "./configuration.js";
import { appendEpfLog, getEpfLogs, resetEpfLogsForTesting } from "./epf-logging.js";
import { ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractPortfolioDataInput,
  EnterprisePortfolioFrameworkState,
  PortfolioFrameworkCockpitSnapshot,
  PortfolioFrameworkRunReport,
  RegisterPortfolioCompanyInput,
  RegisterPortfolioModuleInput,
  RoutePortfolioEventInput,
  RunPortfolioDiagnosticsInput,
} from "./types.js";
import { EnterprisePortfolioFrameworkController } from "./enterprise-portfolio-framework-controller.js";
import { EnterprisePortfolioFrameworkManager } from "./enterprise-portfolio-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface EnterprisePortfolioFrameworkEngineOptions {
  configuration?: Partial<EnterprisePortfolioFrameworkConfiguration>;
}

/**
 * Enterprise Portfolio Framework (PILLOW-EPF-001 / X2-01).
 * Multi-company portfolio architecture — framework only; no later Portfolio Intelligence engines.
 */
export class EnterprisePortfolioFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: EnterprisePortfolioFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: EnterprisePortfolioFrameworkEngineOptions = {},
  ) {
    const config = buildEnterprisePortfolioFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new EnterprisePortfolioFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EnterprisePortfolioFrameworkState> {
    const doc = await this.reader.readText(ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Enterprise Portfolio Framework")) {
      throw new Error(
        `${ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH} missing — Enterprise Portfolio Framework requires X2-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEpfLog({
      event: "ENTERPRISE_PORTFOLIO_FRAMEWORK_ready",
      level: "info",
      details: "X2-01 Enterprise Portfolio Framework initialized",
    });
    return this.getState();
  }

  getState(): EnterprisePortfolioFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Enterprise Portfolio Framework not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const modules = this.controller.getManager().getModules();
    const companies = this.controller.getManager().getCompanies();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      modules,
      companies,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EPF-001",
      missionId: "X2-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      registeredCompanies: companies,
      health,
      performance,
    };
  }

  registerPortfolioModule(input: RegisterPortfolioModuleInput): PortfolioFrameworkRunReport {
    return this.controller.registerPortfolioModule(input);
  }

  registerCompany(input: RegisterPortfolioCompanyInput): PortfolioFrameworkRunReport {
    return this.controller.registerCompany(input);
  }

  activatePortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    return this.controller.activatePortfolioModule(portfolioModuleIdentifier);
  }

  suspendPortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    return this.controller.suspendPortfolioModule(portfolioModuleIdentifier);
  }

  shutdownPortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    return this.controller.shutdownPortfolioModule(portfolioModuleIdentifier);
  }

  routePortfolioEvent(input: RoutePortfolioEventInput): PortfolioFrameworkRunReport {
    return this.controller.routePortfolioEvent(input);
  }

  abstractPortfolioData(input: AbstractPortfolioDataInput): PortfolioFrameworkRunReport {
    return this.controller.abstractPortfolioData(input);
  }

  runDiagnostics(input: RunPortfolioDiagnosticsInput = {}): PortfolioFrameworkRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): PortfolioFrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredModules() {
    return this.controller.getManager().getModules();
  }

  getRegisteredCompanies() {
    return this.controller.getManager().getCompanies();
  }

  updateConfiguration(
    overrides: Partial<EnterprisePortfolioFrameworkConfiguration>,
  ): EnterprisePortfolioFrameworkState {
    const next = buildEnterprisePortfolioFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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
        `Registered companies: ${state.registeredCompanies.length}`,
        `Active modules: ${state.health.activeModules}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No framework operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PortfolioFrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      registeredModules: state.registeredModules.length,
      registeredCompanies: state.registeredCompanies.length,
      activeModules: state.health.activeModules,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      recentLogs: getEpfLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createEnterprisePortfolioFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: EnterprisePortfolioFrameworkEngineOptions,
): EnterprisePortfolioFrameworkEngine {
  return new EnterprisePortfolioFrameworkEngine(bootstrap, options);
}

export function resetEnterprisePortfolioFrameworkForTesting(): void {
  resetEpfLogsForTesting();
  new EnterprisePortfolioFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
