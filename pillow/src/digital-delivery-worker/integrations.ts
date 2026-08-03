import { DIGITAL_DELIVERY_WORKER_IDENTITY } from "./paths.js";
import type {
  DigitalDeliveryReport,
  DigitalDeliveryWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendDdwLog } from "./ddw-logging.js";

/** Optional live workforce integrations for Q5-10 Digital Delivery Worker. */
export type DigitalDeliveryWorkerDependencies = {
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
      deliveryHandoffStatus?: string | null;
      checkoutReady?: boolean | null;
      purchaseInformationValid?: boolean | null;
    }>;
    getLatestCheckoutId?: () => string | null;
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
  orderId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  deliveryType?: string | null;
  deliveryMethod?: string | null;
  customerReference?: string | null;
  customerEmail?: string | null;
  assetLabels?: string[];
  checkoutCompletionValidated?: boolean | null;
  purchaseInformationValid?: boolean | null;
  checkoutReady?: boolean | null;
  deliveryHandoffStatus?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: DigitalDeliveryWorkerDependencies = {};

  bind(deps: DigitalDeliveryWorkerDependencies = {}) {
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
      appendDdwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromValidatedCheckoutCompletion(
    input: DigitalDeliveryWorkerInput,
  ): DigitalDeliveryWorkerInput {
    const checkouts = this.deps.checkoutWorker?.getCheckouts?.() ?? [];
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const reports = this.deps.digitalProductResearchWorker?.getResearchReports?.() ?? [];
    const checkoutMatch =
      checkouts.find((c) => input.checkoutId && c.checkoutId === input.checkoutId) ??
      checkouts.find((c) => input.productId && c.productId === input.productId) ??
      (checkouts.length ? checkouts[checkouts.length - 1] : null);
    const researchMatch =
      reports.find(
        (r) =>
          (input.researchReportId && r.researchReportId === input.researchReportId) ||
          (checkoutMatch?.researchReportId &&
            r.researchReportId === checkoutMatch.researchReportId),
      ) ?? (reports.length ? reports[reports.length - 1] : null);
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.businessId && m.businessId === input.businessId) ||
          (checkoutMatch?.factoryMissionId &&
            m.factoryMissionId === checkoutMatch.factoryMissionId) ||
          (researchMatch?.factoryMissionId &&
            m.factoryMissionId === researchMatch.factoryMissionId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);

    const productTitle =
      input.productTitle ??
      checkoutMatch?.productTitle ??
      researchMatch?.researchTopic ??
      (missionMatch?.businessName ? `${missionMatch.businessName} Delivery` : null);

    const handoffReady =
      checkoutMatch?.deliveryHandoffStatus === "ready_for_handoff" ||
      checkoutMatch?.deliveryHandoffStatus === "prepared";

    return {
      ...input,
      checkoutId:
        input.checkoutId ??
        checkoutMatch?.checkoutId ??
        this.deps.checkoutWorker?.getLatestCheckoutId?.() ??
        null,
      productId: input.productId ?? checkoutMatch?.productId ?? null,
      productTitle,
      researchReportId:
        input.researchReportId ??
        checkoutMatch?.researchReportId ??
        researchMatch?.researchReportId ??
        this.deps.digitalProductResearchWorker?.getLatestResearchReportId?.() ??
        null,
      opportunityId:
        input.opportunityId ?? checkoutMatch?.opportunityId ?? researchMatch?.opportunityId ?? null,
      businessId:
        input.businessId ??
        checkoutMatch?.businessId ??
        researchMatch?.businessId ??
        missionMatch?.businessId ??
        null,
      factoryMissionId:
        input.factoryMissionId ??
        checkoutMatch?.factoryMissionId ??
        researchMatch?.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.digitalProductsFactoryCore?.getLatestMissionId?.() ??
        null,
      checkoutCompletionValidated:
        input.checkoutCompletionValidated ?? handoffReady ?? Boolean(checkoutMatch?.checkoutId),
      purchaseInformationValid:
        input.purchaseInformationValid ?? checkoutMatch?.purchaseInformationValid ?? null,
      checkoutReady: input.checkoutReady ?? checkoutMatch?.checkoutReady ?? null,
      deliveryHandoffStatus:
        input.deliveryHandoffStatus ?? checkoutMatch?.deliveryHandoffStatus ?? null,
    };
  }

  pullCheckoutContext(input: DigitalDeliveryWorkerInput): {
    enrichment: EnrichmentContext | null;
  } {
    const enriched = this.enrichFromValidatedCheckoutCompletion(input);
    const enrichment: EnrichmentContext | null =
      enriched.checkoutId ||
      enriched.orderId ||
      enriched.researchReportId ||
      enriched.businessId ||
      enriched.factoryMissionId
        ? {
            researchReportId: enriched.researchReportId ?? null,
            opportunityId: enriched.opportunityId ?? null,
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            checkoutId: enriched.checkoutId ?? null,
            orderId: enriched.orderId ?? null,
            productId: enriched.productId ?? null,
            productTitle: enriched.productTitle ?? null,
            deliveryType:
              typeof enriched.deliveryType === "string" ? enriched.deliveryType : null,
            deliveryMethod:
              typeof enriched.deliveryMethod === "string" ? enriched.deliveryMethod : null,
            customerReference: enriched.customerReference ?? null,
            customerEmail: enriched.customerEmail ?? null,
            assetLabels: enriched.assetLabels ?? [],
            checkoutCompletionValidated: enriched.checkoutCompletionValidated ?? false,
            purchaseInformationValid: enriched.purchaseInformationValid ?? null,
            checkoutReady: enriched.checkoutReady ?? null,
            deliveryHandoffStatus: enriched.deliveryHandoffStatus ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(deliveries: DigitalDeliveryReport[]): {
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
    const primary = deliveries[deliveries.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_deliveries_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-10",
      currentStatus: "digital_delivery_worker_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: deliveries
        .filter((r) => !r.selfReviewPassed)
        .map((r) => `self_review_blocker:${r.deliveryId}`),
      risks: deliveries
        .filter((r) => r.researchCompliance === "non_compliant")
        .map((r) => `research_compliance_risk:${r.deliveryId}`),
      evidence: [
        `delivery:${primary.productTitle}`,
        `type:${primary.deliveryType}`,
        `method:${primary.deliveryMethod}`,
        `assets:${primary.deliveredAssets.length}`,
        `status:${primary.deliveryStatus}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction:
        "await_pillow_review_of_digital_delivery_no_payment_processing_or_unauthorized_access",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      deliveryCount: deliveries.length,
      confidenceScore: primary.confidenceScore,
      neverProcessedPayments: true,
      neverCreatedProducts: true,
      neverPublishedStorefronts: true,
      neverExposedUnauthorizedAccess: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-ddw-${Date.now()}`;
    appendDdwLog({
      event: "submit_report",
      details: `deliveries=${deliveries.length} executive=${executiveReportId}`,
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
      workerName: DIGITAL_DELIVERY_WORKER_IDENTITY.workerName,
      workerType: DIGITAL_DELIVERY_WORKER_IDENTITY.workerType,
      department: DIGITAL_DELIVERY_WORKER_IDENTITY.department,
      factory: DIGITAL_DELIVERY_WORKER_IDENTITY.factory,
      role: DIGITAL_DELIVERY_WORKER_IDENTITY.role,
      reportingLine: [...DIGITAL_DELIVERY_WORKER_IDENTITY.reportingLine],
      skillProfile: [...DIGITAL_DELIVERY_WORKER_IDENTITY.skillProfile],
      approvedTools: [...DIGITAL_DELIVERY_WORKER_IDENTITY.approvedTools],
      authorityLevel: DIGITAL_DELIVERY_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-10",
        requiredSkills: [...DIGITAL_DELIVERY_WORKER_IDENTITY.skillProfile],
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
    return `Digital Delivery Worker ${workerId} ↔ ${target} (${status})`;
  }
}
