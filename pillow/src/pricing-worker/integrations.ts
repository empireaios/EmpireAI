import { PRICING_WORKER_IDENTITY } from "./paths.js";
import type {
  ApprovedProductPricingInput,
  IntegrationHandshake,
  IntegrationTarget,
  PricingReport,
  PricingWorkerInput,
} from "./types.js";
import { appendPrwLog } from "./prw-logging.js";

/** Optional live workforce integrations for Q3-09 Pricing Worker. */
export type PricingWorkerDependencies = {
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
  productListingWorker?: {
    getListings?: () => Array<{
      listingId?: string;
      productId?: string;
      productName?: string;
      marketplace?: string;
      supplierId?: string | null;
      supplierName?: string | null;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
    }>;
    getLatestListingId?: () => string | null;
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
  private deps: PricingWorkerDependencies = {};

  bind(deps: PricingWorkerDependencies = {}) {
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
      appendPrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromListings(input: PricingWorkerInput): PricingWorkerInput {
    const listings = this.deps.productListingWorker?.getListings?.() ?? [];
    if (!listings.length) return input;
    const match =
      listings.find(
        (l) =>
          (input.listingId && l.listingId === input.listingId) ||
          (input.productId && l.productId === input.productId) ||
          (input.approvedProduct?.productId &&
            l.productId === input.approvedProduct.productId) ||
          (input.approvedProduct?.listingId &&
            l.listingId === input.approvedProduct.listingId),
      ) ?? listings[listings.length - 1];
    if (!match) return input;
    return {
      ...input,
      listingId: input.listingId ?? match.listingId ?? null,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      marketplace: input.marketplace ?? match.marketplace ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
    };
  }

  pullApprovedProduct(input: PricingWorkerInput): ApprovedProductPricingInput | null {
    const enriched = this.enrichFromListings(input);
    const product = {
      ...(enriched.approvedProduct ?? {}),
      productId: enriched.productId ?? enriched.approvedProduct?.productId,
      productName: enriched.productName ?? enriched.approvedProduct?.productName,
      marketplace: enriched.marketplace ?? enriched.approvedProduct?.marketplace,
      listingId: enriched.listingId ?? enriched.approvedProduct?.listingId,
      supplierId: enriched.supplierId ?? enriched.approvedProduct?.supplierId,
      supplierName: enriched.supplierName ?? enriched.approvedProduct?.supplierName,
      supplierCost: enriched.supplierCost ?? enriched.approvedProduct?.supplierCost,
      supplierCostKind:
        enriched.supplierCostKind ?? enriched.approvedProduct?.supplierCostKind,
      shippingCost: enriched.shippingCost ?? enriched.approvedProduct?.shippingCost,
      shippingCostKind:
        enriched.shippingCostKind ?? enriched.approvedProduct?.shippingCostKind,
      currency: enriched.currency ?? enriched.approvedProduct?.currency,
      competitorPrices:
        enriched.competitorPrices ?? enriched.approvedProduct?.competitorPrices,
      evaluationId: enriched.evaluationId ?? enriched.approvedProduct?.evaluationId,
      discoveryId: enriched.discoveryId ?? enriched.approvedProduct?.discoveryId,
      businessMissionId:
        enriched.businessMissionId ?? enriched.approvedProduct?.businessMissionId,
    };
    if (!product.productId?.trim() && !product.productName?.trim()) return null;
    return product;
  }

  submitFindings(reports: PricingReport[]): {
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
        details: "no_pricing_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-09",
      currentStatus: "pricing_recommendation_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter((r) => r.supplierCost.amount <= 0)
        .map((r) => `missing_supplier_cost:${r.pricingId}`),
      risks: reports
        .filter((r) => r.targetProfit.amount < 0)
        .map((r) => `negative_profit:${r.pricingId}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "await_pillow_pricing_approval_before_any_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      pricingCount: reports.length,
      recommendedSellingPrice: primary.recommendedSellingPrice,
      targetMargin: primary.targetMargin,
      neverPublishedPricing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-prw-${Date.now()}`;
    appendPrwLog({
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
      workerName: PRICING_WORKER_IDENTITY.workerName,
      workerType: PRICING_WORKER_IDENTITY.workerType,
      department: PRICING_WORKER_IDENTITY.department,
      factory: PRICING_WORKER_IDENTITY.factory,
      role: PRICING_WORKER_IDENTITY.role,
      reportingLine: [...PRICING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PRICING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PRICING_WORKER_IDENTITY.approvedTools],
      authorityLevel: PRICING_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-09",
        requiredSkills: [...PRICING_WORKER_IDENTITY.skillProfile],
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
      case "product_listing_worker":
        return Boolean(this.deps.productListingWorker?.getListings);
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
    return `Pricing Worker ${workerId} ↔ ${target} (${status})`;
  }
}
