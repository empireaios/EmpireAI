import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousScalingFrameworkConfiguration,
  type AutonomousScalingFrameworkConfiguration,
} from "./configuration.js";
import { appendAsfLog, getAsfLogs, resetAsfLogsForTesting } from "./asf-logging.js";
import { AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  AbstractScalingDataInput,
  AutonomousScalingFrameworkState,
  ScalingFrameworkCockpitSnapshot,
  ScalingFrameworkRunReport,
  RegisterScalingModuleInput,
  RouteScalingEventInput,
  RunScalingDiagnosticsInput,
} from "./types.js";
import { AutonomousScalingFrameworkController } from "./autonomous-scaling-framework-controller.js";
import { AutonomousScalingFrameworkManager } from "./autonomous-scaling-framework-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AutonomousScalingFrameworkEngineOptions {
  configuration?: Partial<AutonomousScalingFrameworkConfiguration>;
}

/**
 * Autonomous Scaling Framework (PILLOW-ASF-001 / X3-01).
 * Reusable autonomous scaling architecture foundation — framework only; no later X3 engines.
 */
export class AutonomousScalingFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousScalingFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: AutonomousScalingFrameworkEngineOptions = {},
  ) {
    const config = buildAutonomousScalingFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new AutonomousScalingFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousScalingFrameworkState> {
    const doc = await this.reader.readText(AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Scaling Framework")) {
      throw new Error(
        `${AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH} missing — Autonomous Scaling Framework requires X3-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAsfLog({
      event: "AUTONOMOUS_SCALING_FRAMEWORK_ready",
      level: "info",
      details: "X3-01 Autonomous Scaling Framework initialized",
    });
    return this.getState();
  }

  getState(): AutonomousScalingFrameworkState {
    if (!this.initializedAt) {
      throw new Error("Autonomous Scaling Framework not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-ASF-001",
      missionId: "X3-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredModules: modules,
      health,
      performance,
    };
  }

  registerScalingModule(input: RegisterScalingModuleInput): ScalingFrameworkRunReport {
    return this.controller.registerScalingModule(input);
  }

  activateScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    return this.controller.activateScalingModule(scalingModuleIdentifier);
  }

  suspendScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    return this.controller.suspendScalingModule(scalingModuleIdentifier);
  }

  shutdownScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    return this.controller.shutdownScalingModule(scalingModuleIdentifier);
  }

  routeScalingEvent(input: RouteScalingEventInput): ScalingFrameworkRunReport {
    return this.controller.routeScalingEvent(input);
  }

  abstractScalingData(input: AbstractScalingDataInput): ScalingFrameworkRunReport {
    return this.controller.abstractScalingData(input);
  }

  runDiagnostics(input: RunScalingDiagnosticsInput = {}): ScalingFrameworkRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ScalingFrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredModules() {
    return this.controller.getManager().getModules();
  }

  updateConfiguration(
    overrides: Partial<AutonomousScalingFrameworkConfiguration>,
  ): AutonomousScalingFrameworkState {
    const next = buildAutonomousScalingFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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

  getCockpitSnapshot(): ScalingFrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      registeredModules: state.registeredModules.length,
      activeModules: state.health.activeModules,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      recentLogs: getAsfLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAutonomousScalingFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: AutonomousScalingFrameworkEngineOptions,
): AutonomousScalingFrameworkEngine {
  return new AutonomousScalingFrameworkEngine(bootstrap, options);
}

export function resetAutonomousScalingFrameworkForTesting(): void {
  resetAsfLogsForTesting();
  new AutonomousScalingFrameworkManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
