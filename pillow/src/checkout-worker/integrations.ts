import { CHECKOUT_WORKER_IDENTITY } from "./paths.js";
import type {
  CheckoutReport,
  CheckoutWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendCkwLog } from "./ckw-logging.js";

/** Optional live workforce integrations for Q5-09 Checkout Worker. */
export type CheckoutWorkerDependencies = {
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
  digitalProductResearchWorker?: {
    getResearchReports?: () => Array<{
      researchReportId?: string;
      opportunityId?: string;
      productCategory?: string;
      targetAudience?: string;
      customerPainPoints?: string[];
      marketGap?: string;
      demandAssessment?: string;
      researchTopic?: string;
      businessId?: string;
      factoryMissionId?: string;
    }>;
    getLatestResearchReportId?: () => string | null;
  } | null;
  salesPageWorker?: {
    getSalesPages?: () => Array<{
      salesPageId?: string;
      productTitle?: string;
      productId?: string;
    }>;
    getLatestSalesPageId?: () => string | null;
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
  salesPageId?: string | null;
  productType?: string | null;
  checkoutFlowType?: string | null;
  productTitle?: string | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  productDescription?: string | null;
  currency?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: CheckoutWorkerDependencies = {};

  bind(deps: CheckoutWorkerDependencies = {}) {
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
      appendCkwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromApprovedProductInformation(input: CheckoutWorkerInput): CheckoutWorkerInput {
    const reports = this.deps.digitalProductResearchWorker?.getResearchReports?.() ?? [];
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const salesPages = this.deps.salesPageWorker?.getSalesPages?.() ?? [];
    const researchMatch =
      reports.find((r) => input.researchReportId && r.researchReportId === input.researchReportId) ??
      reports.find((r) => input.opportunityId && r.opportunityId === input.opportunityId) ??
      (reports.length ? reports[reports.length - 1] : null);
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.businessId && m.businessId === input.businessId) ||
          (researchMatch?.factoryMissionId &&
            m.factoryMissionId === researchMatch.factoryMissionId) ||
          (researchMatch?.businessId && m.businessId === researchMatch.businessId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);
    const salesMatch =
      salesPages.find((s) => input.salesPageId && s.salesPageId === input.salesPageId) ??
      salesPages.find((s) => input.productId && s.productId === input.productId) ??
      (salesPages.length ? salesPages[salesPages.length - 1] : null);

    const productTitle =
      input.productTitle ??
      salesMatch?.productTitle ??
      researchMatch?.researchTopic ??
      (missionMatch?.businessName ? `${missionMatch.businessName} Offer` : null);

    return {
      ...input,
      researchReportId:
        input.researchReportId ??
        researchMatch?.researchReportId ??
        this.deps.digitalProductResearchWorker?.getLatestResearchReportId?.() ??
        null,
      opportunityId: input.opportunityId ?? researchMatch?.opportunityId ?? null,
      businessId:
        input.businessId ?? researchMatch?.businessId ?? missionMatch?.businessId ?? null,
      factoryMissionId:
        input.factoryMissionId ??
        researchMatch?.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.digitalProductsFactoryCore?.getLatestMissionId?.() ??
        null,
      salesPageId:
        input.salesPageId ??
        salesMatch?.salesPageId ??
        this.deps.salesPageWorker?.getLatestSalesPageId?.() ??
        null,
      productId: input.productId ?? salesMatch?.productId ?? null,
      productType:
        input.productType ?? researchMatch?.productCategory ?? missionMatch?.productType ?? null,
      productTitle,
      productCategory: input.productCategory ?? researchMatch?.productCategory ?? null,
      targetAudience: input.targetAudience ?? researchMatch?.targetAudience ?? null,
      customerPainPoints: input.customerPainPoints ?? researchMatch?.customerPainPoints ?? null,
      marketGap: input.marketGap ?? researchMatch?.marketGap ?? null,
      demandAssessment: input.demandAssessment ?? researchMatch?.demandAssessment ?? null,
      researchTopic: input.researchTopic ?? researchMatch?.researchTopic ?? null,
    };
  }

  pullResearchContext(input: CheckoutWorkerInput): {
    enrichment: EnrichmentContext | null;
  } {
    const enriched = this.enrichFromApprovedProductInformation(input);
    const enrichment: EnrichmentContext | null =
      enriched.researchReportId ||
      enriched.businessId ||
      enriched.factoryMissionId ||
      enriched.salesPageId
        ? {
            researchReportId: enriched.researchReportId ?? null,
            opportunityId: enriched.opportunityId ?? null,
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            salesPageId: enriched.salesPageId ?? null,
            productType: typeof enriched.productType === "string" ? enriched.productType : null,
            checkoutFlowType:
              typeof enriched.checkoutFlowType === "string" ? enriched.checkoutFlowType : null,
            productTitle: enriched.productTitle ?? null,
            targetAudience: enriched.targetAudience ?? null,
            customerPainPoints: enriched.customerPainPoints ?? [],
            marketGap: enriched.marketGap ?? null,
            demandAssessment: enriched.demandAssessment ?? null,
            researchTopic: enriched.researchTopic ?? null,
            productDescription: enriched.productDescription ?? null,
            currency: enriched.currency ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(checkouts: CheckoutReport[]): {
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
    const primary = checkouts[checkouts.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_checkouts_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-09",
      currentStatus: "checkout_worker_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: checkouts
        .filter((r) => !r.selfReviewPassed)
        .map((r) => `self_review_blocker:${r.checkoutId}`),
      risks: checkouts
        .filter((r) => r.researchCompliance === "non_compliant")
        .map((r) => `research_compliance_risk:${r.checkoutId}`),
      evidence: [
        `checkout:${primary.productTitle}`,
        `flow:${primary.checkoutFlowType}`,
        `provider:${primary.paymentProviderConfiguration?.provider ?? "none"}`,
        `steps:${primary.checkoutFlow.steps.length}`,
        `handoff:${primary.deliveryHandoffStatus}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction:
        "await_pillow_review_of_checkout_preparation_no_charging_payment_execution_or_delivery",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      checkoutCount: checkouts.length,
      confidenceScore: primary.confidenceScore,
      neverChargedCustomers: true,
      neverExecutedPaymentTransactions: true,
      neverDeliveredProducts: true,
      neverPublishedStorefronts: true,
      neverStoredSensitivePaymentCredentials: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-ckw-${Date.now()}`;
    appendCkwLog({
      event: "submit_report",
      details: `checkouts=${checkouts.length} executive=${executiveReportId}`,
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
      workerName: CHECKOUT_WORKER_IDENTITY.workerName,
      workerType: CHECKOUT_WORKER_IDENTITY.workerType,
      department: CHECKOUT_WORKER_IDENTITY.department,
      factory: CHECKOUT_WORKER_IDENTITY.factory,
      role: CHECKOUT_WORKER_IDENTITY.role,
      reportingLine: [...CHECKOUT_WORKER_IDENTITY.reportingLine],
      skillProfile: [...CHECKOUT_WORKER_IDENTITY.skillProfile],
      approvedTools: [...CHECKOUT_WORKER_IDENTITY.approvedTools],
      authorityLevel: CHECKOUT_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-09",
        requiredSkills: [...CHECKOUT_WORKER_IDENTITY.skillProfile],
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
      case "sales_page_worker":
        return Boolean(this.deps.salesPageWorker?.getSalesPages);
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
    return `Checkout Worker ${workerId} ↔ ${target} (${status})`;
  }
}
