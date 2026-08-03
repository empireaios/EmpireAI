import { ORDER_WORKER_IDENTITY } from "./paths.js";
import type {
  ConfirmedOrderInput,
  IntegrationHandshake,
  IntegrationTarget,
  OrderReport,
  OrderWorkerInput,
} from "./types.js";
import { appendOrwLog } from "./orw-logging.js";

/** Optional live workforce integrations for Q3-11 Order Worker. */
export type OrderWorkerDependencies = {
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerAssignmentEngine?: {
    discoverEligibleWorkers: (input: Record<string, unknown>) => unknown;
  } | null;
  inventoryWorker?: {
    getInventoryReports?: () => Array<{
      inventoryReportId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string | null;
      supplierName?: string | null;
      stockStatus?: string | null;
      currentStock?: number | null;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
    }>;
    getLatestInventoryReportId?: () => string | null;
  } | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
      engineRecord?: { lastReportType?: string | null } | null;
    };
  } | null;
  workerPerformanceReview?: {
    registerPerformanceWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
};

export type InventoryEnrichmentContext = {
  stockStatus?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  inventoryReportId?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  productId?: string | null;
  productName?: string | null;
  currentStock?: number | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: OrderWorkerDependencies = {};

  bind(deps: OrderWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(workerId: string, targets: string[]): IntegrationHandshake[] {
    const now = new Date().toISOString();
    const resolved: IntegrationHandshake[] = [];
    for (const target of targets as IntegrationTarget[]) {
      const status = this.isBound(target) ? "bound" : "ready";
      const handshake: IntegrationHandshake = {
        target,
        status,
        details: this.describe(target, workerId, status),
        timestamp: now,
      };
      resolved.push(handshake);
      appendOrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromInventory(input: OrderWorkerInput): OrderWorkerInput {
    const reports = this.deps.inventoryWorker?.getInventoryReports?.() ?? [];
    if (!reports.length) return input;
    const match =
      reports.find(
        (r) =>
          (input.inventoryReportId && r.inventoryReportId === input.inventoryReportId) ||
          (input.productId && r.productId === input.productId) ||
          (input.supplierId && r.supplierId === input.supplierId) ||
          (input.confirmedOrder?.productId &&
            r.productId === input.confirmedOrder.productId) ||
          (input.confirmedOrder?.inventoryReportId &&
            r.inventoryReportId === input.confirmedOrder.inventoryReportId) ||
          (input.confirmedOrder?.supplierId &&
            r.supplierId === input.confirmedOrder.supplierId),
      ) ?? reports[reports.length - 1];
    if (!match) return input;
    return {
      ...input,
      inventoryReportId: input.inventoryReportId ?? match.inventoryReportId ?? null,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
    };
  }

  pullOrderContext(input: OrderWorkerInput): {
    order: ConfirmedOrderInput | null;
    inventory: InventoryEnrichmentContext | null;
  } {
    const enriched = this.enrichFromInventory(input);
    const order: ConfirmedOrderInput = {
      ...(enriched.confirmedOrder ?? {}),
      orderId: enriched.orderId ?? enriched.confirmedOrder?.orderId,
      customerId: enriched.customerId ?? enriched.confirmedOrder?.customerId,
      productId: enriched.productId ?? enriched.confirmedOrder?.productId,
      productName: enriched.productName ?? enriched.confirmedOrder?.productName,
      supplierId: enriched.supplierId ?? enriched.confirmedOrder?.supplierId,
      supplierName: enriched.supplierName ?? enriched.confirmedOrder?.supplierName,
      quantity: enriched.quantity ?? enriched.confirmedOrder?.quantity,
      orderStatus: enriched.orderStatus ?? enriched.confirmedOrder?.orderStatus,
      fulfilmentStatus:
        enriched.fulfilmentStatus ?? enriched.confirmedOrder?.fulfilmentStatus,
      shippingStatus: enriched.shippingStatus ?? enriched.confirmedOrder?.shippingStatus,
      expectedShipDate:
        enriched.expectedShipDate ?? enriched.confirmedOrder?.expectedShipDate,
      actualShipDate: enriched.actualShipDate ?? enriched.confirmedOrder?.actualShipDate,
      orderReceivedAt: enriched.orderReceivedAt ?? enriched.confirmedOrder?.orderReceivedAt,
      delayDaysThreshold:
        enriched.delayDaysThreshold ?? enriched.confirmedOrder?.delayDaysThreshold,
      inventoryReportId:
        enriched.inventoryReportId ?? enriched.confirmedOrder?.inventoryReportId,
      evaluationId: enriched.evaluationId ?? enriched.confirmedOrder?.evaluationId,
      discoveryId: enriched.discoveryId ?? enriched.confirmedOrder?.discoveryId,
      businessMissionId:
        enriched.businessMissionId ?? enriched.confirmedOrder?.businessMissionId,
    };

    const reports = this.deps.inventoryWorker?.getInventoryReports?.() ?? [];
    const invMatch =
      reports.find(
        (r) =>
          (order.inventoryReportId && r.inventoryReportId === order.inventoryReportId) ||
          (order.productId && r.productId === order.productId) ||
          (order.supplierId && r.supplierId === order.supplierId),
      ) ?? null;

    const inventory: InventoryEnrichmentContext | null = invMatch
      ? {
          stockStatus: invMatch.stockStatus ?? null,
          supplierId: invMatch.supplierId ?? null,
          supplierName: invMatch.supplierName ?? null,
          inventoryReportId: invMatch.inventoryReportId ?? null,
          evaluationId: invMatch.evaluationId ?? null,
          discoveryId: invMatch.discoveryId ?? null,
          businessMissionId: invMatch.businessMissionId ?? null,
          productId: invMatch.productId ?? null,
          productName: invMatch.productName ?? null,
          currentStock: invMatch.currentStock ?? null,
        }
      : null;

    if (!order.orderId?.trim() && !(order.customerId?.trim() && order.productId?.trim())) {
      return { order: null, inventory };
    }
    return { order, inventory };
  }

  submitFindings(reports: OrderReport[]): {
    submitted: boolean;
    executiveReportId: string | null;
    details: string;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "executive_reporting_runtime_unavailable",
      };
    }
    const primary = reports[reports.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_order_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.orderId,
      missionId: "Q3-11",
      currentStatus: "order_lifecycle_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter((r) => r.failedFulfilment || r.exceptions.some((e) => e.severity === "critical"))
        .map((r) => `order_blocker:${r.orderReportId}:${r.orderStatus}`),
      risks: reports
        .filter((r) => r.delayed || r.orderStatus === "exception")
        .map((r) => `order_risk:${r.orderReportId}:${r.orderStatus}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "await_pillow_order_guidance_before_any_payment_refund_or_inventory_change",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      orderCount: reports.length,
      orderStatus: primary.orderStatus,
      fulfilmentStatus: primary.fulfilmentStatus,
      shippingStatus: primary.shippingStatus,
      neverProcessedPayments: true,
      neverAlteredFinancialRecords: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-orw-${Date.now()}`;
    appendOrwLog({
      event: "submit_findings",
      details: `reports=${reports.length} executive=${executiveReportId}`,
    });
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: ORDER_WORKER_IDENTITY.workerName,
      workerType: ORDER_WORKER_IDENTITY.workerType,
      department: ORDER_WORKER_IDENTITY.department,
      factory: ORDER_WORKER_IDENTITY.factory,
      role: ORDER_WORKER_IDENTITY.role,
      reportingLine: [...ORDER_WORKER_IDENTITY.reportingLine],
      skillProfile: [...ORDER_WORKER_IDENTITY.skillProfile],
      approvedTools: [...ORDER_WORKER_IDENTITY.approvedTools],
      authorityLevel: ORDER_WORKER_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };

    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* registry may reject duplicates */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* lifecycle optional */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q3-11",
        requiredSkills: [...ORDER_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* assignment optional */
    }
    try {
      this.deps.workerPerformanceReview?.registerPerformanceWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* performance optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* recovery optional */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return Boolean(this.deps.workerRegistry?.registerWorker);
      case "worker_lifecycle":
        return Boolean(this.deps.workerLifecycle?.createWorker);
      case "worker_assignment_engine":
        return Boolean(this.deps.workerAssignmentEngine?.discoverEligibleWorkers);
      case "inventory_worker":
        return Boolean(this.deps.inventoryWorker?.getInventoryReports);
      case "executive_reporting_runtime":
        return Boolean(this.deps.executiveReportingRuntime?.submitWorkerReport);
      case "worker_performance_review":
        return Boolean(this.deps.workerPerformanceReview?.registerPerformanceWorker);
      case "worker_recovery_system":
        return Boolean(this.deps.workerRecoverySystem?.registerRecoverableWorker);
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string) {
    return `Order Worker ${workerId} ↔ ${target} (${status})`;
  }
}
