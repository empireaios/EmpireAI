import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import {
  buildProcurementEngineConfiguration,
  type ProcurementEngineConfiguration,
} from "./configuration.js";
import { appendPceLog, getPceLogs, resetPceLogsForTesting } from "./pce-logging.js";
import { PROCUREMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ApproveProcurementInput,
  CreateProcurementRequestInput,
  ProcurementCockpitSnapshot,
  ProcurementReport,
  ProcurementEngineState,
} from "./types.js";
import { ProcurementController } from "./procurement-controller.js";
import { ProcurementManager } from "./procurement-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ProcurementEngineOptions {
  configuration?: Partial<ProcurementEngineConfiguration>;
}

/**
 * Procurement Engine (PILLOW-PCE-001 / R2-09).
 * Intelligent purchasing — consumes R2-05 through R2-08.
 */
export class ProcurementEngine {
  private initializedAt: string | null = null;
  private readonly controller: ProcurementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    productSync: SupplierProductSyncEngine,
    inventorySync: SupplierInventorySyncEngine,
    pricingEngine: SupplierPricingEngine,
    rankingEngine: SupplierRankingEngine,
    options: ProcurementEngineOptions = {},
  ) {
    const config = buildProcurementEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ProcurementManager(
      productSync,
      inventorySync,
      pricingEngine,
      rankingEngine,
    );
    this.controller = new ProcurementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProcurementEngineState> {
    const doc = await this.reader.readText(PROCUREMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Procurement Engine")) {
      throw new Error(
        `${PROCUREMENT_ENGINE_SYSTEM_PATH} missing — Procurement Engine requires R2-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPceLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-09 Procurement Engine initialized",
    });
    return this.getState();
  }

  getState(): ProcurementEngineState {
    if (!this.initializedAt) {
      throw new Error("Procurement Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const purchaseOrders = this.controller.getManager().getPurchaseOrders();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PCE-001",
      missionId: "R2-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      purchaseOrders,
      health,
      performance,
    };
  }

  createProcurementRequest(
    input: CreateProcurementRequestInput = {},
  ): ProcurementReport {
    return this.controller.createProcurementRequest(input);
  }

  approveProcurement(input: ApproveProcurementInput): ProcurementReport {
    return this.controller.approveProcurement(input);
  }

  getLatestReport(): ProcurementReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getPurchaseOrders() {
    return this.controller.getManager().getPurchaseOrders();
  }

  updateConfiguration(
    overrides: Partial<ProcurementEngineConfiguration>,
  ): ProcurementEngineState {
    const next = buildProcurementEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Procurement engine status: ${state.status}`,
        `Procurement count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No procurement operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProcurementCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      procurementCount: state.records.length,
      purchaseOrderCount: state.purchaseOrders.length,
      lastProcurementAt: state.health.lastProcurementAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      approvalsPending: state.health.approvalsPending,
      purchaseOrdersCreated: state.performance.purchaseOrdersCreated,
      recentLogs: getPceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createProcurementEngine(
  bootstrap: EmpireBootstrapContext,
  productSync: SupplierProductSyncEngine,
  inventorySync: SupplierInventorySyncEngine,
  pricingEngine: SupplierPricingEngine,
  rankingEngine: SupplierRankingEngine,
  options?: ProcurementEngineOptions,
): ProcurementEngine {
  return new ProcurementEngine(
    bootstrap,
    productSync,
    inventorySync,
    pricingEngine,
    rankingEngine,
    options,
  );
}

export function resetProcurementEngineForTesting(): void {
  resetPceLogsForTesting();
  new ProcurementManager(null, null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
