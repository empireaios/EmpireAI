import { PRODUCT_LISTING_WORKER_IDENTITY } from "./paths.js";
import type {
  ApprovedImageRef,
  IntegrationHandshake,
  IntegrationTarget,
  ProductListingReport,
  ProductListingWorkerInput,
} from "./types.js";
import { appendPlwLog } from "./plw-logging.js";

/** Optional live workforce integrations for Q3-08 Product Listing Worker. */
export type ProductListingWorkerDependencies = {
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
  productImageWorker?: {
    getImageReports?: () => Array<{
      imageReportId?: string;
      packageId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string;
      supplierName?: string;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
      imageQualityStatus?: string;
      complianceStatus?: string;
      processedImages?: Array<{
        derivedUri?: string;
        role?: string;
      }>;
    }>;
    getLatestImageReportId?: () => string | null;
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
  private deps: ProductListingWorkerDependencies = {};

  bind(deps: ProductListingWorkerDependencies = {}) {
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
      appendPlwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  pullApprovedImages(input: ProductListingWorkerInput): ApprovedImageRef | null {
    if (input.approvedImages) return { ...input.approvedImages };
    const reports = this.deps.productImageWorker?.getImageReports?.() ?? [];
    if (!reports.length) {
      return input.imageReportId ? { imageReportId: input.imageReportId } : null;
    }
    const match =
      reports.find(
        (r) =>
          (input.imageReportId && r.imageReportId === input.imageReportId) ||
          (input.productId && r.productId === input.productId) ||
          (input.approvedProduct?.productId &&
            r.productId === input.approvedProduct.productId),
      ) ?? reports[reports.length - 1];
    if (!match) return null;
    const primary =
      match.processedImages?.find((p) => p.role === "primary")?.derivedUri ??
      match.processedImages?.[0]?.derivedUri ??
      null;
    const gallery =
      match.processedImages
        ?.filter((p) => p.role === "gallery" && p.derivedUri)
        .map((p) => p.derivedUri!) ?? [];
    return {
      imageReportId: match.imageReportId ?? null,
      packageId: match.packageId ?? null,
      primaryImageUri: primary,
      galleryImageUris: gallery,
      imageQualityStatus: match.imageQualityStatus ?? null,
      complianceStatus: match.complianceStatus ?? null,
    };
  }

  enrichFromImages(input: ProductListingWorkerInput): ProductListingWorkerInput {
    const reports = this.deps.productImageWorker?.getImageReports?.() ?? [];
    if (!reports.length) return input;
    const match =
      reports.find(
        (r) =>
          (input.imageReportId && r.imageReportId === input.imageReportId) ||
          (input.productId && r.productId === input.productId),
      ) ?? reports[reports.length - 1];
    if (!match) return input;
    return {
      ...input,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
      imageReportId: input.imageReportId ?? match.imageReportId ?? null,
    };
  }

  submitFindings(listings: ProductListingReport[]): {
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
    const primary = listings[listings.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_listings_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-08",
      currentStatus: "product_listing_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: listings
        .filter((l) => l.listingValidationStatus === "fail")
        .map((l) => `listing_fail:${l.listingId}`),
      risks: listings
        .filter((l) => l.listingValidationStatus === "review")
        .map((l) => `listing_review:${l.listingId}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        primary.listingValidationStatus === "pass"
          ? "await_pillow_approval_before_any_publish"
          : primary.listingValidationStatus === "review"
            ? "await_pillow_listing_review"
            : "repair_required_listing_fields",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      listingCount: listings.length,
      marketplace: primary.marketplace,
      listingValidationStatus: primary.listingValidationStatus,
      neverPublishedListings: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-plw-${Date.now()}`;
    appendPlwLog({
      event: "submit_findings",
      details: `listings=${listings.length} executive=${executiveReportId}`,
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
      workerName: PRODUCT_LISTING_WORKER_IDENTITY.workerName,
      workerType: PRODUCT_LISTING_WORKER_IDENTITY.workerType,
      department: PRODUCT_LISTING_WORKER_IDENTITY.department,
      factory: PRODUCT_LISTING_WORKER_IDENTITY.factory,
      role: PRODUCT_LISTING_WORKER_IDENTITY.role,
      reportingLine: [...PRODUCT_LISTING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PRODUCT_LISTING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PRODUCT_LISTING_WORKER_IDENTITY.approvedTools],
      authorityLevel: PRODUCT_LISTING_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-08",
        requiredSkills: [...PRODUCT_LISTING_WORKER_IDENTITY.skillProfile],
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
      case "product_image_worker":
        return Boolean(this.deps.productImageWorker?.getImageReports);
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
    return `Product Listing Worker ${workerId} ↔ ${target} (${status})`;
  }
}
