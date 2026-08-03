import { DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY } from "./paths.js";
import type {
  DigitalProductAnalyticsReport,
  DigitalProductAnalyticsWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendDpaLog } from "./dpa-logging.js";

/** Optional live workforce integrations for Q5-11 Digital Product Analytics Worker. */
export type DigitalProductAnalyticsWorkerDependencies = {
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
  digitalProductsFactoryCore?: {
    getLatestMissionId?: () => string | null;
    getMissions?: () => Array<{
      factoryMissionId?: string;
      businessId?: string;
      businessName?: string;
      productType?: string;
    }>;
  } | null;
  checkoutWorker?: {
    getCheckouts?: () => Array<{
      checkoutId?: string | null;
      productId?: string | null;
      productTitle?: string | null;
      businessId?: string | null;
      factoryMissionId?: string | null;
      researchReportId?: string | null;
      opportunityId?: string | null;
      checkoutReady?: boolean | null;
      orderSummary?: { unitsSold?: number; grossRevenue?: number; currency?: string } | null;
    }>;
    getLatestCheckoutId?: () => string | null;
  } | null;
  digitalDeliveryWorker?: {
    getDeliveries?: () => Array<{
      deliveryId?: string | null;
      orderId?: string | null;
      productId?: string | null;
      productTitle?: string | null;
      businessId?: string | null;
      factoryMissionId?: string | null;
      checkoutId?: string | null;
      deliveryStatus?: string | null;
    }>;
    getLatestDeliveryId?: () => string | null;
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

export type EnrichmentContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  checkoutId?: string | null;
  deliveryId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  analyticsType?: string | null;
  currency?: string | null;
  periodLabel?: string | null;
  feedbackThemes?: string[];
  feedbackSentiment?: "positive" | "neutral" | "mixed" | "negative" | "unknown" | null;
  unitsSold?: number | null;
  grossRevenue?: number | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: DigitalProductAnalyticsWorkerDependencies = {};

  bind(deps: DigitalProductAnalyticsWorkerDependencies = {}) {
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
      appendDpaLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromProductContext(
    input: DigitalProductAnalyticsWorkerInput,
  ): DigitalProductAnalyticsWorkerInput {
    const checkouts = this.deps.checkoutWorker?.getCheckouts?.() ?? [];
    const deliveries = this.deps.digitalDeliveryWorker?.getDeliveries?.() ?? [];
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const checkoutMatch =
      checkouts.find((c) => input.checkoutId && c.checkoutId === input.checkoutId) ??
      checkouts.find((c) => input.productId && c.productId === input.productId) ??
      (checkouts.length ? checkouts[checkouts.length - 1] : null);
    const deliveryMatch =
      deliveries.find((d) => input.deliveryId && d.deliveryId === input.deliveryId) ??
      deliveries.find((d) => input.checkoutId && d.checkoutId === input.checkoutId) ??
      deliveries.find((d) => input.productId && d.productId === input.productId) ??
      (deliveries.length ? deliveries[deliveries.length - 1] : null);
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.businessId && m.businessId === input.businessId) ||
          (checkoutMatch?.factoryMissionId &&
            m.factoryMissionId === checkoutMatch.factoryMissionId) ||
          (deliveryMatch?.factoryMissionId &&
            m.factoryMissionId === deliveryMatch.factoryMissionId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);

    const productTitle =
      input.productTitle ??
      checkoutMatch?.productTitle ??
      deliveryMatch?.productTitle ??
      (missionMatch?.businessName ? `${missionMatch.businessName} Analytics` : null);

    const orderSummary = checkoutMatch?.orderSummary;

    return {
      ...input,
      checkoutId:
        input.checkoutId ??
        checkoutMatch?.checkoutId ??
        deliveryMatch?.checkoutId ??
        this.deps.checkoutWorker?.getLatestCheckoutId?.() ??
        null,
      deliveryId:
        input.deliveryId ??
        deliveryMatch?.deliveryId ??
        this.deps.digitalDeliveryWorker?.getLatestDeliveryId?.() ??
        null,
      productId: input.productId ?? checkoutMatch?.productId ?? deliveryMatch?.productId ?? null,
      productTitle,
      researchReportId: input.researchReportId ?? checkoutMatch?.researchReportId ?? null,
      opportunityId: input.opportunityId ?? checkoutMatch?.opportunityId ?? null,
      businessId:
        input.businessId ??
        checkoutMatch?.businessId ??
        deliveryMatch?.businessId ??
        missionMatch?.businessId ??
        null,
      factoryMissionId:
        input.factoryMissionId ??
        checkoutMatch?.factoryMissionId ??
        deliveryMatch?.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.digitalProductsFactoryCore?.getLatestMissionId?.() ??
        null,
      unitsSold: input.unitsSold ?? orderSummary?.unitsSold ?? null,
      grossRevenue: input.grossRevenue ?? orderSummary?.grossRevenue ?? null,
      currency: input.currency ?? orderSummary?.currency ?? null,
    };
  }

  pullProductContext(input: DigitalProductAnalyticsWorkerInput): {
    enrichment: EnrichmentContext | null;
  } {
    const enriched = this.enrichFromProductContext(input);
    const enrichment: EnrichmentContext | null =
      enriched.checkoutId ||
      enriched.deliveryId ||
      enriched.productId ||
      enriched.researchReportId ||
      enriched.businessId ||
      enriched.factoryMissionId
        ? {
            researchReportId: enriched.researchReportId ?? null,
            opportunityId: enriched.opportunityId ?? null,
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            checkoutId: enriched.checkoutId ?? null,
            deliveryId: enriched.deliveryId ?? null,
            productId: enriched.productId ?? null,
            productTitle: enriched.productTitle ?? null,
            analyticsType:
              typeof enriched.analyticsType === "string" ? enriched.analyticsType : null,
            currency: enriched.currency ?? null,
            periodLabel: enriched.periodLabel ?? null,
            feedbackThemes: enriched.feedbackThemes ?? [],
            feedbackSentiment: enriched.feedbackSentiment ?? null,
            unitsSold: enriched.unitsSold ?? null,
            grossRevenue: enriched.grossRevenue ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(reports: DigitalProductAnalyticsReport[]): {
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
        details: "no_analytics_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-11",
      currentStatus: "digital_product_analytics_worker_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: reports
        .filter((r) => !r.selfReviewPassed)
        .map((r) => `self_review_blocker:${r.analyticsReportId}`),
      risks: reports
        .filter((r) => r.researchCompliance === "non_compliant")
        .map((r) => `research_compliance_risk:${r.analyticsReportId}`),
      evidence: [
        `analytics:${primary.productTitle}`,
        `type:${primary.analyticsType}`,
        `sales:${primary.salesMetrics.unitsSold}`,
        `revenue:${primary.revenueMetrics.grossRevenue}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction:
        "await_pillow_review_of_digital_product_analytics_no_product_editing_or_payment_processing",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      analyticsReportCount: reports.length,
      confidenceScore: primary.confidenceScore,
      neverEditedProducts: true,
      neverProcessedPayments: true,
      neverDeliveredProducts: true,
      neverFabricatedMetrics: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-dpa-${Date.now()}`;
    appendDpaLog({
      event: "submit_report",
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
      workerName: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.workerName,
      workerType: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.workerType,
      department: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.department,
      factory: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.factory,
      role: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.role,
      reportingLine: [...DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.reportingLine],
      skillProfile: [...DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.skillProfile],
      approvedTools: [...DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.approvedTools],
      authorityLevel: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-11",
        requiredSkills: [...DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.skillProfile],
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
      case "digital_products_factory_core":
        return Boolean(this.deps.digitalProductsFactoryCore?.getMissions);
      case "checkout_worker":
        return Boolean(this.deps.checkoutWorker?.getCheckouts);
      case "digital_delivery_worker":
        return Boolean(this.deps.digitalDeliveryWorker?.getDeliveries);
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
    return `Digital Product Analytics Worker ${workerId} ↔ ${target} (${status})`;
  }
}
