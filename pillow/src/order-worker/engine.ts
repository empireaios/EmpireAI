import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOrderWorkerConfiguration,
  type OrderWorkerConfiguration,
} from "./configuration.js";
import type { OrderWorkerDependencies } from "./integrations.js";
import { OrderWorkerController } from "./order-worker-controller.js";
import { resetOrwLogsForTesting } from "./orw-logging.js";
import { ORDER_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetOrderSequenceForTesting } from "./order-builder.js";
import { OrderManager } from "./order-manager.js";
import type {
  OrderWorkerCockpitSnapshot,
  OrderWorkerInput,
  OrderWorkerState,
} from "./types.js";

export interface OrderWorkerOptions {
  configuration?: Partial<OrderWorkerConfiguration>;
  dependencies?: OrderWorkerDependencies;
}

/** Authoritative Q3-11 Order Worker — lifecycle tracking only. */
export class OrderWorker {
  private initializedAt: string | null = null;
  private readonly controller: OrderWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OrderWorkerOptions = {},
  ) {
    const manager = new OrderManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new OrderWorkerController(
      manager,
      buildOrderWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ORDER_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Order Worker")) {
      throw new Error(`${ORDER_WORKER_SYSTEM_PATH} missing — Q3-11 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: OrderWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): OrderWorkerState {
    if (!this.initializedAt) {
      throw new Error("Order Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ORW-001",
      missionId: "Q3-11",
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
        totalOrderReports: engineRecord?.totalOrderReports ?? 0,
        lastOrderReportId: engineRecord?.lastOrderReportId ?? null,
        lastOrderStatus: engineRecord?.lastOrderStatus ?? null,
        lastFulfilmentStatus: engineRecord?.lastFulfilmentStatus ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Lifecycle-only: does not process payments, issue refunds, modify inventory, alter financial records, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectOrderWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveConfirmedCustomerOrders(input: OrderWorkerInput = {}) {
    return this.controller.receiveConfirmedOrders(input);
  }

  routeOrdersToSupplier(input: OrderWorkerInput = {}) {
    return this.controller.routeToSupplier(input);
  }

  trackFulfilmentStatus(input: OrderWorkerInput = {}) {
    return this.controller.trackFulfilment(input);
  }

  trackShipmentStatus(input: OrderWorkerInput = {}) {
    return this.controller.trackShipment(input);
  }

  detectFulfilmentExceptions(input: OrderWorkerInput = {}) {
    return this.controller.detectExceptions(input);
  }

  detectDelayedOrders(input: OrderWorkerInput = {}) {
    return this.controller.detectDelayed(input);
  }

  detectFailedFulfilment(input: OrderWorkerInput = {}) {
    return this.controller.detectFailedFulfilment(input);
  }

  generateCustomerStatusUpdates(input: OrderWorkerInput = {}) {
    return this.controller.generateCustomerUpdates(input);
  }

  escalateCriticalOrderIssues(input: OrderWorkerInput = {}) {
    return this.controller.escalateIssues(input);
  }

  maintainCompleteOrderHistory(input: OrderWorkerInput = {}) {
    return this.controller.maintainHistory(input);
  }

  produceOrderReport(input: OrderWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: OrderWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listOrderReports() {
    return this.controller.list();
  }

  validateOrderWorker(input: OrderWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getOrderReports() {
    return this.controller.getManager().getOrderReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestOrderReportId() {
    return this.controller.getManager().getLatestOrderReportId();
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
        `Order reports: ${state.health.totalOrderReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OrderWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-11",
      status: state.status,
      healthStatus: state.health.status,
      totalOrderReports: state.health.totalOrderReports,
      latestOrderReportId: this.getLatestOrderReportId(),
      lastOrderStatus: state.health.lastOrderStatus,
      lastFulfilmentStatus: state.health.lastFulfilmentStatus,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverProcessPayments: true,
      neverIssueRefunds: true,
      neverModifyInventoryDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverAlterFinancialRecords: true,
    };
  }
}

export function createOrderWorker(
  bootstrap: EmpireBootstrapContext,
  options?: OrderWorkerOptions,
) {
  return new OrderWorker(bootstrap, options);
}

export function resetOrderWorkerForTesting() {
  resetOrwLogsForTesting();
  resetOrderSequenceForTesting();
}
