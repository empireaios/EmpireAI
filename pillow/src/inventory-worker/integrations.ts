import { INVENTORY_WORKER_IDENTITY } from "./paths.js";
import type {
  ApprovedProductInventoryInput,
  IntegrationHandshake,
  IntegrationTarget,
  InventoryReport,
  InventoryWorkerInput,
} from "./types.js";
import { appendInwLog } from "./inw-logging.js";

/** Optional live workforce integrations for Q3-10 Inventory Worker. */
export type InventoryWorkerDependencies = {
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
  supplierEvaluationWorker?: {
    getEvaluations?: () => Array<{
      evaluationId?: string;
      supplierId?: string;
      supplierName?: string;
      productId?: string | null;
      productName?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
      overallScore?: number | null;
    }>;
    getLatestEvaluationId?: () => string | null;
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

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: InventoryWorkerDependencies = {};

  bind(deps: InventoryWorkerDependencies = {}) {
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
      appendInwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromEvaluations(input: InventoryWorkerInput): InventoryWorkerInput {
    const evaluations = this.deps.supplierEvaluationWorker?.getEvaluations?.() ?? [];
    if (!evaluations.length) return input;
    const match =
      evaluations.find(
        (e) =>
          (input.evaluationId && e.evaluationId === input.evaluationId) ||
          (input.productId && e.productId === input.productId) ||
          (input.supplierId && e.supplierId === input.supplierId) ||
          (input.approvedProduct?.productId &&
            e.productId === input.approvedProduct.productId) ||
          (input.approvedProduct?.evaluationId &&
            e.evaluationId === input.approvedProduct.evaluationId) ||
          (input.approvedProduct?.supplierId &&
            e.supplierId === input.approvedProduct.supplierId),
      ) ?? evaluations[evaluations.length - 1];
    if (!match) return input;
    return {
      ...input,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
    };
  }

  pullApprovedProduct(input: InventoryWorkerInput): ApprovedProductInventoryInput | null {
    const enriched = this.enrichFromEvaluations(input);
    const product = {
      ...(enriched.approvedProduct ?? {}),
      productId: enriched.productId ?? enriched.approvedProduct?.productId,
      productName: enriched.productName ?? enriched.approvedProduct?.productName,
      supplierId: enriched.supplierId ?? enriched.approvedProduct?.supplierId,
      supplierName: enriched.supplierName ?? enriched.approvedProduct?.supplierName,
      currentStock: enriched.currentStock ?? enriched.approvedProduct?.currentStock,
      previousStock: enriched.previousStock ?? enriched.approvedProduct?.previousStock,
      supplierStockAvailable:
        enriched.supplierStockAvailable ?? enriched.approvedProduct?.supplierStockAvailable,
      leadTimeDays: enriched.leadTimeDays ?? enriched.approvedProduct?.leadTimeDays,
      dailyDemand: enriched.dailyDemand ?? enriched.approvedProduct?.dailyDemand,
      safetyStockDays: enriched.safetyStockDays ?? enriched.approvedProduct?.safetyStockDays,
      supplierAvailability:
        enriched.supplierAvailability ?? enriched.approvedProduct?.supplierAvailability,
      evaluationId: enriched.evaluationId ?? enriched.approvedProduct?.evaluationId,
      discoveryId: enriched.discoveryId ?? enriched.approvedProduct?.discoveryId,
      businessMissionId:
        enriched.businessMissionId ?? enriched.approvedProduct?.businessMissionId,
    };
    if (!product.productId?.trim() && !product.productName?.trim()) return null;
    return product;
  }

  submitFindings(reports: InventoryReport[]): {
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
        details: "no_inventory_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-10",
      currentStatus: "inventory_monitoring_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter((r) => r.stockStatus === "out_of_stock")
        .map((r) => `out_of_stock:${r.inventoryReportId}`),
      risks: reports
        .filter(
          (r) =>
            r.stockStatus === "low_stock" ||
            r.supplierAvailability === "unavailable" ||
            r.abnormalChangeDetected,
        )
        .map((r) => `inventory_risk:${r.inventoryReportId}:${r.stockStatus}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "await_pillow_inventory_guidance_before_any_purchase_or_order",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      inventoryCount: reports.length,
      currentStock: primary.currentStock,
      reorderPoint: primary.reorderPoint,
      stockStatus: primary.stockStatus,
      neverPurchasedInventory: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-inw-${Date.now()}`;
    appendInwLog({
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
      workerName: INVENTORY_WORKER_IDENTITY.workerName,
      workerType: INVENTORY_WORKER_IDENTITY.workerType,
      department: INVENTORY_WORKER_IDENTITY.department,
      factory: INVENTORY_WORKER_IDENTITY.factory,
      role: INVENTORY_WORKER_IDENTITY.role,
      reportingLine: [...INVENTORY_WORKER_IDENTITY.reportingLine],
      skillProfile: [...INVENTORY_WORKER_IDENTITY.skillProfile],
      approvedTools: [...INVENTORY_WORKER_IDENTITY.approvedTools],
      authorityLevel: INVENTORY_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-10",
        requiredSkills: [...INVENTORY_WORKER_IDENTITY.skillProfile],
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
      case "supplier_evaluation_worker":
        return Boolean(this.deps.supplierEvaluationWorker?.getEvaluations);
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
    return `Inventory Worker ${workerId} ↔ ${target} (${status})`;
  }
}
