import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalExpansionFrameworkConfiguration,
  type GlobalExpansionFrameworkConfiguration,
} from "./configuration.js";
import { appendGefLog, getGefLogs, resetGefLogsForTesting } from "./gef-logging.js";
import { GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractRegionalDataInput,
  GlobalExpansionFrameworkState,
  ExpansionFrameworkCockpitSnapshot,
  ExpansionFrameworkRunReport,
  RegisterExpansionModuleInput,
  RouteExpansionEventInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";
import { GlobalExpansionFrameworkController } from "./global-expansion-framework-controller.js";
import { GlobalExpansionFrameworkManager } from "./global-expansion-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalExpansionFrameworkEngineOptions {
  configuration?: Partial<GlobalExpansionFrameworkConfiguration>;
}

/**
 * Global Expansion Framework (PILLOW-GEF-001 / X4-01).
 * Reusable global expansion architecture foundation — framework only; no later X4 engines.
 */
export class GlobalExpansionFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: GlobalExpansionFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: GlobalExpansionFrameworkEngineOptions = {},
  ) {
    const config = buildGlobalExpansionFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new GlobalExpansionFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalExpansionFrameworkState> {
    const doc = await this.reader.readText(GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Global Expansion Framework")) {
      throw new Error(
        `${GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH} missing — Global Expansion Framework requires X4-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGefLog({
      event: "GLOBAL_EXPANSION_FRAMEWORK_ready",
      level: "info",
      details: "X4-01 Global Expansion Framework initialized",
    });
    return this.getState();
  }

  getState(): GlobalExpansionFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Global Expansion Framework not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-GEF-001",
      missionId: "X4-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      health,
      performance,
    };
  }

  registerExpansionModule(input: RegisterExpansionModuleInput): ExpansionFrameworkRunReport {
    return this.controller.registerExpansionModule(input);
  }

  activateExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    return this.controller.activateExpansionModule(expansionModuleIdentifier);
  }

  suspendExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    return this.controller.suspendExpansionModule(expansionModuleIdentifier);
  }

  shutdownExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    return this.controller.shutdownExpansionModule(expansionModuleIdentifier);
  }

  routeExpansionEvent(input: RouteExpansionEventInput): ExpansionFrameworkRunReport {
    return this.controller.routeExpansionEvent(input);
  }

  abstractRegionalData(input: AbstractRegionalDataInput): ExpansionFrameworkRunReport {
    return this.controller.abstractRegionalData(input);
  }

  runDiagnostics(input: RunExpansionDiagnosticsInput = {}): ExpansionFrameworkRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ExpansionFrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredModules() {
    return this.controller.getManager().getModules();
  }

  updateConfiguration(
    overrides: Partial<GlobalExpansionFrameworkConfiguration>,
  ): GlobalExpansionFrameworkState {
    const next = buildGlobalExpansionFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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

  getCockpitSnapshot(): ExpansionFrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      registeredModules: state.registeredModules.length,
      activeModules: state.health.activeModules,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      recentLogs: getGefLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalExpansionFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: GlobalExpansionFrameworkEngineOptions,
): GlobalExpansionFrameworkEngine {
  return new GlobalExpansionFrameworkEngine(bootstrap, options);
}

export function resetGlobalExpansionFrameworkForTesting(): void {
  resetGefLogsForTesting();
  new GlobalExpansionFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
