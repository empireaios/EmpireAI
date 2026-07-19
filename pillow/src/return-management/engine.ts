import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import {
  buildReturnManagementConfiguration,
  type ReturnManagementConfiguration,
} from "./configuration.js";
import { appendRmLog, getRmLogs, resetRmLogsForTesting } from "./rm-logging.js";
import { RETURN_MANAGEMENT_SYSTEM_PATH } from "./paths.js";
import type {
  CreateReturnRequestInput,
  ReceiveCustomerReturnRequestInput,
  ReturnCockpitSnapshot,
  ReturnManagementState,
  ReturnReport,
  TrackReturnLifecycleInput,
} from "./types.js";
import { ReturnManagementController } from "./return-management-controller.js";
import { ReturnManagementManager } from "./return-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ReturnManagementOptions {
  configuration?: Partial<ReturnManagementConfiguration>;
}

/**
 * Return Management (PILLOW-RM-001 / R2-13).
 * Automated return processing — consumes R2-12 Shipment Tracking Engine.
 */
export class ReturnManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: ReturnManagementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    shipmentTracking: ShipmentTrackingEngine,
    options: ReturnManagementOptions = {},
  ) {
    const config = buildReturnManagementConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ReturnManagementManager(shipmentTracking);
    this.controller = new ReturnManagementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ReturnManagementState> {
    const doc = await this.reader.readText(RETURN_MANAGEMENT_SYSTEM_PATH);
    if (!doc?.includes("Return Management")) {
      throw new Error(
        `${RETURN_MANAGEMENT_SYSTEM_PATH} missing — Return Management requires R2-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRmLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-13 Return Management initialized",
    });
    return this.getState();
  }

  getState(): ReturnManagementState {
    if (!this.initializedAt) {
      throw new Error("Return Management not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-RM-001",
      missionId: "R2-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  createReturnRequest(input: CreateReturnRequestInput = {}): ReturnReport {
    return this.controller.createReturnRequest(input);
  }

  receiveCustomerReturnRequest(input: ReceiveCustomerReturnRequestInput): ReturnReport {
    return this.controller.receiveCustomerReturnRequest(input);
  }

  trackReturnLifecycle(input: TrackReturnLifecycleInput): ReturnReport {
    return this.controller.trackReturnLifecycle(input);
  }

  getLatestReport(): ReturnReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<ReturnManagementConfiguration>,
  ): ReturnManagementState {
    const next = buildReturnManagementConfiguration(this.bootstrap.repositoryRoot, {
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
        `Return management status: ${state.status}`,
        `Return count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No return operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ReturnCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      returnCount: state.records.length,
      lastOperationAt: state.health.lastOperationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      authorizedCount: state.health.authorizedCount,
      completedCount: state.health.completedCount,
      failedCount: state.health.failedCount,
      recentLogs: getRmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createReturnManagementEngine(
  bootstrap: EmpireBootstrapContext,
  shipmentTracking: ShipmentTrackingEngine,
  options?: ReturnManagementOptions,
): ReturnManagementEngine {
  return new ReturnManagementEngine(bootstrap, shipmentTracking, options);
}

export function resetReturnManagementForTesting(): void {
  resetRmLogsForTesting();
  new ReturnManagementManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
