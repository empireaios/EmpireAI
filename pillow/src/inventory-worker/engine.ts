import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInventoryWorkerConfiguration,
  type InventoryWorkerConfiguration,
} from "./configuration.js";
import type { InventoryWorkerDependencies } from "./integrations.js";
import { InventoryWorkerController } from "./inventory-worker-controller.js";
import { resetInwLogsForTesting } from "./inw-logging.js";
import { INVENTORY_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetInventorySequenceForTesting } from "./inventory-builder.js";
import { InventoryManager } from "./inventory-manager.js";
import type {
  InventoryWorkerCockpitSnapshot,
  InventoryWorkerInput,
  InventoryWorkerState,
} from "./types.js";

export interface InventoryWorkerOptions {
  configuration?: Partial<InventoryWorkerConfiguration>;
  dependencies?: InventoryWorkerDependencies;
}

/** Authoritative Q3-10 Inventory Worker — monitoring only. */
export class InventoryWorker {
  private initializedAt: string | null = null;
  private readonly controller: InventoryWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: InventoryWorkerOptions = {},
  ) {
    const manager = new InventoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new InventoryWorkerController(
      manager,
      buildInventoryWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      INVENTORY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Inventory Worker")) {
      throw new Error(`${INVENTORY_WORKER_SYSTEM_PATH} missing — Q3-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: InventoryWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): InventoryWorkerState {
    if (!this.initializedAt) {
      throw new Error("Inventory Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-INW-001",
      missionId: "Q3-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalInventoryReports: engineRecord?.totalInventoryReports ?? 0,
        lastInventoryReportId: engineRecord?.lastInventoryReportId ?? null,
        lastStockStatus: engineRecord?.lastStockStatus ?? null,
        lastReorderPoint: engineRecord?.lastReorderPoint ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Monitoring-only: does not purchase inventory, modify supplier stock, place supplier orders, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectInventoryWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedProducts(input: InventoryWorkerInput = {}) {
    return this.controller.receiveApprovedProducts(input);
  }

  monitorSupplierStockAvailability(input: InventoryWorkerInput = {}) {
    return this.controller.monitorSupplierStock(input);
  }

  monitorInventoryQuantities(input: InventoryWorkerInput = {}) {
    return this.controller.monitorInventoryQuantities(input);
  }

  monitorLeadTimes(input: InventoryWorkerInput = {}) {
    return this.controller.monitorLeadTimes(input);
  }

  monitorSupplierAvailability(input: InventoryWorkerInput = {}) {
    return this.controller.monitorSupplierAvailability(input);
  }

  calculateReorderPoints(input: InventoryWorkerInput = {}) {
    return this.controller.calculateReorderPoints(input);
  }

  detectLowStockConditions(input: InventoryWorkerInput = {}) {
    return this.controller.detectLowStock(input);
  }

  detectOutOfStockConditions(input: InventoryWorkerInput = {}) {
    return this.controller.detectOutOfStock(input);
  }

  detectAbnormalInventoryChanges(input: InventoryWorkerInput = {}) {
    return this.controller.detectAbnormalChanges(input);
  }

  generateInventoryAlerts(input: InventoryWorkerInput = {}) {
    return this.controller.generateAlerts(input);
  }

  produceInventoryReport(input: InventoryWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: InventoryWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listInventoryReports() {
    return this.controller.list();
  }

  validateInventoryWorker(input: InventoryWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getInventoryReports() {
    return this.controller.getManager().getInventoryReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestInventoryReportId() {
    return this.controller.getManager().getLatestInventoryReportId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Inventory reports: ${state.health.totalInventoryReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): InventoryWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-10",
      status: state.status,
      healthStatus: state.health.status,
      totalInventoryReports: state.health.totalInventoryReports,
      latestInventoryReportId: this.getLatestInventoryReportId(),
      lastStockStatus: state.health.lastStockStatus,
      lastReorderPoint: state.health.lastReorderPoint,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPurchaseInventory: true,
      neverModifySupplierStock: true,
      neverPlaceSupplierOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverModifySupplierInventoryDirectly: true,
    };
  }
}

export function createInventoryWorker(
  bootstrap: EmpireBootstrapContext,
  options?: InventoryWorkerOptions,
) {
  return new InventoryWorker(bootstrap, options);
}

export function resetInventoryWorkerForTesting() {
  resetInwLogsForTesting();
  resetInventorySequenceForTesting();
}
