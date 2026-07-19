import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketingFrameworkConfiguration,
  type MarketingFrameworkConfiguration,
} from "./configuration.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
  resetFrameworkLogsForTesting,
} from "./mfw-logging.js";
import { MARKETING_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractMarketingDataInput,
  FrameworkCockpitSnapshot,
  FrameworkRunReport,
  RegisterMarketingModuleInput,
  RouteMarketingEventInput,
  RunDiagnosticsInput,
  MarketingFrameworkState,
} from "./types.js";
import { MarketingFrameworkController } from "./marketing-framework-controller.js";
import { MarketingFrameworkManager } from "./marketing-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MarketingFrameworkEngineOptions {
  configuration?: Partial<MarketingFrameworkConfiguration>;
}

/**
 * Marketing Framework (PILLOW-MFW-001 / R5-01).
 * Unified marketing architecture — framework only, no live marketing integrations.
 */
export class MarketingFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketingFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: MarketingFrameworkEngineOptions = {},
  ) {
    const config = buildMarketingFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new MarketingFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketingFrameworkState> {
    const doc = await this.reader.readText(MARKETING_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Marketing Framework")) {
      throw new Error(
        `${MARKETING_FRAMEWORK_SYSTEM_PATH} missing — Marketing Framework requires R5-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrameworkLog({
      event: "marketing_framework_ready",
      level: "info",
      details: "R5-01 Marketing Framework initialized",
    });
    return this.getState();
  }

  getState(): MarketingFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Marketing Framework not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-MFW-001",
      missionId: "R5-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      health,
      performance,
    };
  }

  registerMarketingModule(input: RegisterMarketingModuleInput): FrameworkRunReport {
    return this.controller.registerMarketingModule(input);
  }

  activateMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    return this.controller.activateMarketingModule(marketingModuleIdentifier);
  }

  suspendMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    return this.controller.suspendMarketingModule(marketingModuleIdentifier);
  }

  shutdownMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    return this.controller.shutdownMarketingModule(marketingModuleIdentifier);
  }

  routeMarketingEvent(input: RouteMarketingEventInput): FrameworkRunReport {
    return this.controller.routeMarketingEvent(input);
  }

  abstractMarketingData(input: AbstractMarketingDataInput): FrameworkRunReport {
    return this.controller.abstractMarketingData(input);
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
    overrides: Partial<MarketingFrameworkConfiguration>,
  ): MarketingFrameworkState {
    const next = buildMarketingFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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

export function createMarketingFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: MarketingFrameworkEngineOptions,
): MarketingFrameworkEngine {
  return new MarketingFrameworkEngine(bootstrap, options);
}

export function resetMarketingFrameworkForTesting(): void {
  resetFrameworkLogsForTesting();
  new MarketingFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
