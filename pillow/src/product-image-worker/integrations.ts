import { PRODUCT_IMAGE_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  ProductImageReport,
  ProductImageWorkerInput,
} from "./types.js";
import { appendPiwLog } from "./piw-logging.js";

/** Optional live workforce integrations for Q3-07 Product Image Worker. */
export type ProductImageWorkerDependencies = {
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
      discoveryId?: string | null;
      supplierId?: string;
      supplierName?: string;
      productId?: string;
      productName?: string;
      recommendation?: string;
      businessMissionId?: string | null;
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
  private deps: ProductImageWorkerDependencies = {};

  bind(deps: ProductImageWorkerDependencies = {}) {
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
      appendPiwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromEvaluations(input: ProductImageWorkerInput): ProductImageWorkerInput {
    const evaluations = this.deps.supplierEvaluationWorker?.getEvaluations?.() ?? [];
    if (!evaluations.length) return input;
    const match =
      evaluations.find(
        (e) =>
          (input.evaluationId && e.evaluationId === input.evaluationId) ||
          (input.supplierId && e.supplierId === input.supplierId) ||
          (input.productId && e.productId === input.productId),
      ) ?? evaluations[evaluations.length - 1];
    if (!match) return input;
    return {
      ...input,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
    };
  }

  submitFindings(reports: ProductImageReport[]): {
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
        details: "no_image_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-07",
      currentStatus: "product_images_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter((r) => r.complianceStatus === "non_compliant")
        .map((r) => `non_compliant:${r.productId}`),
      risks: reports
        .filter((r) => r.imageQualityStatus === "fail")
        .map((r) => `quality_fail:${r.imageReportId}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        primary.complianceStatus === "compliant"
          ? "hand_off_visual_assets_to_downstream_commerce"
          : primary.complianceStatus === "review_required"
            ? "await_pillow_image_review"
            : "request_replacement_supplier_images",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      imageReportCount: reports.length,
      imageQualityStatus: primary.imageQualityStatus,
      complianceStatus: primary.complianceStatus,
      neverPublishedListings: true,
      neverOverwroteOriginals: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-piw-${Date.now()}`;
    appendPiwLog({
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
      workerName: PRODUCT_IMAGE_WORKER_IDENTITY.workerName,
      workerType: PRODUCT_IMAGE_WORKER_IDENTITY.workerType,
      department: PRODUCT_IMAGE_WORKER_IDENTITY.department,
      factory: PRODUCT_IMAGE_WORKER_IDENTITY.factory,
      role: PRODUCT_IMAGE_WORKER_IDENTITY.role,
      reportingLine: [...PRODUCT_IMAGE_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PRODUCT_IMAGE_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PRODUCT_IMAGE_WORKER_IDENTITY.approvedTools],
      authorityLevel: PRODUCT_IMAGE_WORKER_IDENTITY.authorityLevel,
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
      /* lifecycle optional during isolated tests */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q3-07",
        requiredSkills: [...PRODUCT_IMAGE_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* assignment optional during isolated tests */
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
    return `Product Image Worker ${workerId} ↔ ${target} (${status})`;
  }
}
