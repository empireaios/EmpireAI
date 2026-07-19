import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildFinancialFrameworkConfiguration,
  type FinancialFrameworkConfiguration,
} from "./configuration.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
  resetFrameworkLogsForTesting,
} from "./ff-logging.js";
import { FINANCIAL_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractFinancialDataInput,
  FrameworkCockpitSnapshot,
  FrameworkRunReport,
  RegisterFinancialModuleInput,
  RouteFinancialEventInput,
  RunDiagnosticsInput,
  FinancialFrameworkState,
} from "./types.js";
import { FinancialFrameworkController } from "./financial-framework-controller.js";
import { FinancialFrameworkManager } from "./financial-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface FinancialFrameworkEngineOptions {
  configuration?: Partial<FinancialFrameworkConfiguration>;
}

/**
 * Financial Framework (PILLOW-FF-001 / R3-01).
 * Unified financial architecture — framework only, no live financial integrations.
 */
export class FinancialFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: FinancialFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: FinancialFrameworkEngineOptions = {},
  ) {
    const config = buildFinancialFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new FinancialFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FinancialFrameworkState> {
    const doc = await this.reader.readText(FINANCIAL_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Financial Framework")) {
      throw new Error(
        `${FINANCIAL_FRAMEWORK_SYSTEM_PATH} missing — Financial Framework requires R3-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrameworkLog({
      event: "financial_framework_ready",
      level: "info",
      details: "R3-01 Financial Framework initialized",
    });
    return this.getState();
  }

  getState(): FinancialFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Financial Framework not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-FF-001",
      missionId: "R3-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      health,
      performance,
    };
  }

  registerFinancialModule(input: RegisterFinancialModuleInput): FrameworkRunReport {
    return this.controller.registerFinancialModule(input);
  }

  activateFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    return this.controller.activateFinancialModule(financialModuleIdentifier);
  }

  suspendFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    return this.controller.suspendFinancialModule(financialModuleIdentifier);
  }

  shutdownFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    return this.controller.shutdownFinancialModule(financialModuleIdentifier);
  }

  routeFinancialEvent(input: RouteFinancialEventInput): FrameworkRunReport {
    return this.controller.routeFinancialEvent(input);
  }

  abstractFinancialData(input: AbstractFinancialDataInput): FrameworkRunReport {
    return this.controller.abstractFinancialData(input);
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
    overrides: Partial<FinancialFrameworkConfiguration>,
  ): FinancialFrameworkState {
    const next = buildFinancialFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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

export function createFinancialFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: FinancialFrameworkEngineOptions,
): FinancialFrameworkEngine {
  return new FinancialFrameworkEngine(bootstrap, options);
}

export function resetFinancialFrameworkForTesting(): void {
  resetFrameworkLogsForTesting();
  new FinancialFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
