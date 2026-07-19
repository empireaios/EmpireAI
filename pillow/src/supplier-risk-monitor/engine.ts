import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import type { ProcurementEngine } from "../procurement-engine/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { MultiWarehouseSupportEngine } from "../multi-warehouse-support/engine.js";
import {
  buildSupplierRiskMonitorConfiguration,
  type SupplierRiskMonitorConfiguration,
} from "./configuration.js";
import { appendSrmLog, getSrmLogs, resetSrmLogsForTesting } from "./srm-logging.js";
import { SUPPLIER_RISK_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  MonitorSupplierHealthInput,
  SupplierRiskCockpitSnapshot,
  SupplierRiskMonitorState,
  SupplierRiskReport,
} from "./types.js";
import { SupplierRiskMonitorController } from "./supplier-risk-monitor-controller.js";
import { SupplierRiskMonitorManager } from "./supplier-risk-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierRiskMonitorOptions {
  configuration?: Partial<SupplierRiskMonitorConfiguration>;
}

/**
 * Supplier Risk Monitor (PILLOW-SRM-001 / R2-16).
 * Continuous supplier risk monitoring — consumes R2-06, R2-08, R2-09, R2-15.
 */
export class SupplierRiskMonitorEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierRiskMonitorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    rankingEngine: SupplierRankingEngine,
    procurementEngine: ProcurementEngine,
    inventorySync: SupplierInventorySyncEngine,
    multiWarehouseSupport: MultiWarehouseSupportEngine,
    options: SupplierRiskMonitorOptions = {},
  ) {
    const config = buildSupplierRiskMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierRiskMonitorManager(
      rankingEngine,
      procurementEngine,
      inventorySync,
      multiWarehouseSupport,
    );
    this.controller = new SupplierRiskMonitorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierRiskMonitorState> {
    const doc = await this.reader.readText(SUPPLIER_RISK_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Supplier Risk Monitor")) {
      throw new Error(
        `${SUPPLIER_RISK_MONITOR_SYSTEM_PATH} missing — Supplier Risk Monitor requires R2-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSrmLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-16 Supplier Risk Monitor initialized",
    });
    return this.getState();
  }

  getState(): SupplierRiskMonitorState {
    if (!this.initializedAt) {
      throw new Error("Supplier Risk Monitor not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-SRM-001",
      missionId: "R2-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  monitorSupplierHealth(input: MonitorSupplierHealthInput = {}): SupplierRiskReport {
    return this.controller.monitorSupplierHealth(input);
  }

  getLatestReport(): SupplierRiskReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<SupplierRiskMonitorConfiguration>,
  ): SupplierRiskMonitorState {
    const next = buildSupplierRiskMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Supplier risk monitor status: ${state.status}`,
        `Supplier count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No monitoring operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierRiskCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      supplierCount: state.records.length,
      lastMonitorAt: state.health.lastMonitorAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      highRiskCount: state.health.highRiskCount,
      disruptionCount: state.health.disruptionCount,
      alertsGenerated: state.health.alertsGenerated,
      recentLogs: getSrmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierRiskMonitorEngine(
  bootstrap: EmpireBootstrapContext,
  rankingEngine: SupplierRankingEngine,
  procurementEngine: ProcurementEngine,
  inventorySync: SupplierInventorySyncEngine,
  multiWarehouseSupport: MultiWarehouseSupportEngine,
  options?: SupplierRiskMonitorOptions,
): SupplierRiskMonitorEngine {
  return new SupplierRiskMonitorEngine(
    bootstrap,
    rankingEngine,
    procurementEngine,
    inventorySync,
    multiWarehouseSupport,
    options,
  );
}

export function resetSupplierRiskMonitorForTesting(): void {
  resetSrmLogsForTesting();
  new SupplierRiskMonitorManager(null, null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
