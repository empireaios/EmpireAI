import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ProcurementEngine } from "../procurement-engine/engine.js";
import {
  buildFulfilmentOrchestratorConfiguration,
  type FulfilmentOrchestratorConfiguration,
} from "./configuration.js";
import { appendFoLog, getFoLogs, resetFoLogsForTesting } from "./fo-logging.js";
import { FULFILMENT_ORCHESTRATOR_SYSTEM_PATH } from "./paths.js";
import type {
  FulfilmentCockpitSnapshot,
  FulfilmentReport,
  FulfilmentOrchestratorState,
  ReceiveFulfilmentRequirementsInput,
  RouteFulfilmentInput,
} from "./types.js";
import { FulfilmentOrchestratorController } from "./fulfilment-orchestrator-controller.js";
import { FulfilmentOrchestratorManager } from "./fulfilment-orchestrator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface FulfilmentOrchestratorOptions {
  configuration?: Partial<FulfilmentOrchestratorConfiguration>;
}

/**
 * Fulfilment Orchestrator (PILLOW-FO-001 / R2-10).
 * Intelligent order routing — consumes R2-09 Procurement Engine.
 */
export class FulfilmentOrchestrator {
  private initializedAt: string | null = null;
  private readonly controller: FulfilmentOrchestratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    procurementEngine: ProcurementEngine,
    options: FulfilmentOrchestratorOptions = {},
  ) {
    const config = buildFulfilmentOrchestratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FulfilmentOrchestratorManager(procurementEngine);
    this.controller = new FulfilmentOrchestratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FulfilmentOrchestratorState> {
    const doc = await this.reader.readText(FULFILMENT_ORCHESTRATOR_SYSTEM_PATH);
    if (!doc?.includes("Fulfilment Orchestrator")) {
      throw new Error(
        `${FULFILMENT_ORCHESTRATOR_SYSTEM_PATH} missing — Fulfilment Orchestrator requires R2-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFoLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-10 Fulfilment Orchestrator initialized",
    });
    return this.getState();
  }

  getState(): FulfilmentOrchestratorState {
    if (!this.initializedAt) {
      throw new Error("Fulfilment Orchestrator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FO-001",
      missionId: "R2-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  routeFulfilment(input: RouteFulfilmentInput = {}): FulfilmentReport {
    return this.controller.routeFulfilment(input);
  }

  receiveFulfilmentRequirements(input: ReceiveFulfilmentRequirementsInput): FulfilmentReport {
    return this.controller.receiveFulfilmentRequirements(input);
  }

  getLatestReport(): FulfilmentReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<FulfilmentOrchestratorConfiguration>,
  ): FulfilmentOrchestratorState {
    const next = buildFulfilmentOrchestratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Fulfilment orchestrator status: ${state.status}`,
        `Fulfilment count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No fulfilment operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FulfilmentCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      fulfilmentCount: state.records.length,
      lastRoutingAt: state.health.lastRoutingAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      fulfilledCount: state.performance.fulfilmentsCompleted,
      blockedWorkflows: state.health.blockedWorkflows,
      routingFailures: state.health.routingFailures,
      recentLogs: getFoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFulfilmentOrchestrator(
  bootstrap: EmpireBootstrapContext,
  procurementEngine: ProcurementEngine,
  options?: FulfilmentOrchestratorOptions,
): FulfilmentOrchestrator {
  return new FulfilmentOrchestrator(bootstrap, procurementEngine, options);
}

export function resetFulfilmentOrchestratorForTesting(): void {
  resetFoLogsForTesting();
  new FulfilmentOrchestratorManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
