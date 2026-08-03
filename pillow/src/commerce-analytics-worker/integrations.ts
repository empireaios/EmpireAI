import { COMMERCE_ANALYTICS_WORKER_IDENTITY } from "./paths.js";
import type {
  AnalyticsContextInput,
  CommerceAnalyticsReport,
  CommerceAnalyticsWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendCawLog } from "./caw-logging.js";

/** Optional live workforce integrations for Q3-13 Commerce Analytics Worker. */
export type CommerceAnalyticsWorkerDependencies = {
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
  pricingWorker?: {
    getPricingReports?: () => Array<{
      pricingId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string | null;
      recommendedSellingPrice?: number | null;
      targetMargin?: number | null;
      targetProfit?: { amount?: number } | null;
      totalLandedCost?: { amount?: number } | null;
      businessMissionId?: string | null;
    }>;
    getLatestPricingId?: () => string | null;
  } | null;
  inventoryWorker?: {
    getInventoryReports?: () => Array<{
      inventoryReportId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string | null;
      stockStatus?: string | null;
      currentStock?: number | null;
      reorderPoint?: number | null;
      businessMissionId?: string | null;
    }>;
    getLatestInventoryReportId?: () => string | null;
  } | null;
  orderWorker?: {
    getOrderReports?: () => Array<{
      orderReportId?: string;
      orderId?: string;
      productId?: string;
      customerId?: string;
      supplierId?: string | null;
      quantity?: number | null;
      orderStatus?: string | null;
      delayed?: boolean | null;
      failedFulfilment?: boolean | null;
      businessMissionId?: string | null;
    }>;
    getLatestOrderReportId?: () => string | null;
  } | null;
  refundDisputeWorker?: {
    getCases?: () => Array<{
      caseId?: string | null;
      orderId?: string | null;
      productId?: string | null;
      customerId?: string | null;
      supplierId?: string | null;
      caseType?: string | null;
      currentStatus?: string | null;
      businessMissionId?: string | null;
    }>;
    getLatestCaseId?: () => string | null;
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

export type CommerceEnrichmentContext = {
  businessId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  businessMissionId?: string | null;
  pricingReportId?: string | null;
  inventoryReportId?: string | null;
  orderReportIds?: string[];
  refundCaseIds?: string[];
  recommendedSellingPrice?: number | null;
  landedCost?: number | null;
  targetMargin?: number | null;
  currentStock?: number | null;
  reorderPoint?: number | null;
  stockStatus?: string | null;
  estimatedUnitsSold?: number | null;
  estimatedRevenue?: number | null;
  estimatedOrderCount?: number | null;
  estimatedIssueCount?: number | null;
  estimatedRefundCount?: number | null;
  estimatedOnTimeFulfilments?: number | null;
  estimatedTotalFulfilments?: number | null;
  estimatedFulfilmentFailures?: number | null;
  topIssueTypes?: string[];
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: CommerceAnalyticsWorkerDependencies = {};

  bind(deps: CommerceAnalyticsWorkerDependencies = {}) {
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
      appendCawLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromCommerceWorkers(
    input: CommerceAnalyticsWorkerInput,
  ): CommerceAnalyticsWorkerInput {
    const pricingReports = this.deps.pricingWorker?.getPricingReports?.() ?? [];
    const inventoryReports = this.deps.inventoryWorker?.getInventoryReports?.() ?? [];
    const orderReports = this.deps.orderWorker?.getOrderReports?.() ?? [];
    const cases = this.deps.refundDisputeWorker?.getCases?.() ?? [];

    const productId =
      input.productId ?? input.analyticsContext?.productId ?? null;
    const businessMissionId =
      input.businessMissionId ?? input.analyticsContext?.businessMissionId ?? null;

    const pricingMatch =
      pricingReports.find(
        (r) =>
          (input.pricingReportId && r.pricingId === input.pricingReportId) ||
          (productId && r.productId === productId) ||
          (input.analyticsContext?.pricingReportId &&
            r.pricingId === input.analyticsContext.pricingReportId),
      ) ?? (pricingReports.length ? pricingReports[pricingReports.length - 1] : null);

    const inventoryMatch =
      inventoryReports.find(
        (r) =>
          (input.inventoryReportId &&
            r.inventoryReportId === input.inventoryReportId) ||
          (productId && r.productId === productId) ||
          (input.analyticsContext?.inventoryReportId &&
            r.inventoryReportId === input.analyticsContext.inventoryReportId),
      ) ??
      (inventoryReports.length
        ? inventoryReports[inventoryReports.length - 1]
        : null);

    const matchingOrders = productId
      ? orderReports.filter((r) => r.productId === productId)
      : orderReports;
    const matchingCases = productId
      ? cases.filter((c) => c.productId === productId)
      : cases;

    return {
      ...input,
      productId: input.productId ?? pricingMatch?.productId ?? inventoryMatch?.productId ?? matchingOrders[0]?.productId ?? null,
      productName:
        input.productName ??
        pricingMatch?.productName ??
        inventoryMatch?.productName ??
        null,
      supplierId:
        input.supplierId ??
        pricingMatch?.supplierId ??
        inventoryMatch?.supplierId ??
        matchingOrders[0]?.supplierId ??
        null,
      recommendedSellingPrice:
        input.recommendedSellingPrice ??
        pricingMatch?.recommendedSellingPrice ??
        null,
      landedCost:
        input.landedCost ?? pricingMatch?.totalLandedCost?.amount ?? null,
      targetMargin: input.targetMargin ?? pricingMatch?.targetMargin ?? null,
      currentStock: input.currentStock ?? inventoryMatch?.currentStock ?? null,
      reorderPoint: input.reorderPoint ?? inventoryMatch?.reorderPoint ?? null,
      pricingReportId:
        input.pricingReportId ??
        pricingMatch?.pricingId ??
        this.deps.pricingWorker?.getLatestPricingId?.() ??
        null,
      inventoryReportId:
        input.inventoryReportId ??
        inventoryMatch?.inventoryReportId ??
        this.deps.inventoryWorker?.getLatestInventoryReportId?.() ??
        null,
      orderReportIds:
        input.orderReportIds ??
        matchingOrders
          .map((r) => r.orderReportId)
          .filter((id): id is string => Boolean(id)),
      refundCaseIds:
        input.refundCaseIds ??
        matchingCases.map((c) => c.caseId).filter((id): id is string => Boolean(id)),
      businessMissionId:
        input.businessMissionId ??
        businessMissionId ??
        pricingMatch?.businessMissionId ??
        inventoryMatch?.businessMissionId ??
        matchingOrders[0]?.businessMissionId ??
        matchingCases[0]?.businessMissionId ??
        null,
    };
  }

  pullAnalyticsContext(input: CommerceAnalyticsWorkerInput): {
    analyticsContext: AnalyticsContextInput | null;
    enrichment: CommerceEnrichmentContext | null;
  } {
    const enriched = this.enrichFromCommerceWorkers(input);
    const base = enriched.analyticsContext ?? {};
    const analyticsContext: AnalyticsContextInput = {
      ...base,
      businessId: enriched.businessId ?? base.businessId,
      productId: enriched.productId ?? base.productId,
      productName: enriched.productName ?? base.productName,
      supplierId: enriched.supplierId ?? base.supplierId,
      supplierName: enriched.supplierName ?? base.supplierName,
      unitsSold: enriched.unitsSold ?? base.unitsSold,
      revenue: enriched.revenue ?? base.revenue,
      sessions: enriched.sessions ?? base.sessions,
      orders: enriched.orders ?? base.orders,
      averageOrderValue: enriched.averageOrderValue ?? base.averageOrderValue,
      grossProfit: enriched.grossProfit ?? base.grossProfit,
      netProfit: enriched.netProfit ?? base.netProfit,
      costOfGoods: enriched.costOfGoods ?? base.costOfGoods,
      customerIssueCount: enriched.customerIssueCount ?? base.customerIssueCount,
      refundCount: enriched.refundCount ?? base.refundCount,
      refundAmount: enriched.refundAmount ?? base.refundAmount,
      onTimeFulfilments: enriched.onTimeFulfilments ?? base.onTimeFulfilments,
      totalFulfilments: enriched.totalFulfilments ?? base.totalFulfilments,
      fulfilmentFailures: enriched.fulfilmentFailures ?? base.fulfilmentFailures,
      currentStock: enriched.currentStock ?? base.currentStock,
      reorderPoint: enriched.reorderPoint ?? base.reorderPoint,
      recommendedSellingPrice:
        enriched.recommendedSellingPrice ?? base.recommendedSellingPrice,
      landedCost: enriched.landedCost ?? base.landedCost,
      targetMargin: enriched.targetMargin ?? base.targetMargin,
      previousUnitsSold: enriched.previousUnitsSold ?? base.previousUnitsSold,
      previousRevenue: enriched.previousRevenue ?? base.previousRevenue,
      previousConversionRate:
        enriched.previousConversionRate ?? base.previousConversionRate,
      previousNetProfit: enriched.previousNetProfit ?? base.previousNetProfit,
      previousRefundRate: enriched.previousRefundRate ?? base.previousRefundRate,
      periodLabel: enriched.periodLabel ?? base.periodLabel,
      pricingReportId: enriched.pricingReportId ?? base.pricingReportId,
      inventoryReportId: enriched.inventoryReportId ?? base.inventoryReportId,
      orderReportIds: enriched.orderReportIds ?? base.orderReportIds,
      refundCaseIds: enriched.refundCaseIds ?? base.refundCaseIds,
      businessMissionId: enriched.businessMissionId ?? base.businessMissionId,
    };

    const orderReports = this.deps.orderWorker?.getOrderReports?.() ?? [];
    const cases = this.deps.refundDisputeWorker?.getCases?.() ?? [];
    const inventoryReports = this.deps.inventoryWorker?.getInventoryReports?.() ?? [];
    const pricingReports = this.deps.pricingWorker?.getPricingReports?.() ?? [];

    const productId = analyticsContext.productId?.trim() || null;
    const matchingOrders = productId
      ? orderReports.filter((r) => r.productId === productId)
      : orderReports;
    const matchingCases = productId
      ? cases.filter((c) => c.productId === productId)
      : cases;
    const inventoryMatch =
      inventoryReports.find(
        (r) =>
          (analyticsContext.inventoryReportId &&
            r.inventoryReportId === analyticsContext.inventoryReportId) ||
          (productId && r.productId === productId),
      ) ?? null;
    const pricingMatch =
      pricingReports.find(
        (r) =>
          (analyticsContext.pricingReportId &&
            r.pricingId === analyticsContext.pricingReportId) ||
          (productId && r.productId === productId),
      ) ?? null;

    const estimatedUnitsSold = matchingOrders.reduce(
      (sum, r) => sum + (Number.isFinite(Number(r.quantity)) ? Number(r.quantity) : 0),
      0,
    );
    const estimatedOrderCount = matchingOrders.length;
    const estimatedFailures = matchingOrders.filter((r) => r.failedFulfilment).length;
    const estimatedDelayed = matchingOrders.filter((r) => r.delayed).length;
    const estimatedOnTime = Math.max(
      0,
      estimatedOrderCount - estimatedFailures - estimatedDelayed,
    );
    const refundCases = matchingCases.filter(
      (c) =>
        String(c.caseType ?? "").toLowerCase().includes("refund") ||
        String(c.caseType ?? "").toLowerCase() === "return" ||
        String(c.caseType ?? "").toLowerCase() === "chargeback",
    );
    const issueTypeCounts = new Map<string, number>();
    for (const c of matchingCases) {
      const t = c.caseType?.trim() || "general_support";
      issueTypeCounts.set(t, (issueTypeCounts.get(t) ?? 0) + 1);
    }
    const topIssueTypes = [...issueTypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    const price = pricingMatch?.recommendedSellingPrice ?? null;
    const estimatedRevenue =
      price != null && estimatedUnitsSold > 0
        ? Number((price * estimatedUnitsSold).toFixed(2))
        : null;

    const enrichment: CommerceEnrichmentContext | null =
      productId ||
      analyticsContext.businessId ||
      matchingOrders.length ||
      pricingMatch ||
      inventoryMatch
        ? {
            businessId: analyticsContext.businessId ?? null,
            productId,
            productName:
              analyticsContext.productName ??
              pricingMatch?.productName ??
              inventoryMatch?.productName ??
              null,
            supplierId:
              analyticsContext.supplierId ??
              pricingMatch?.supplierId ??
              inventoryMatch?.supplierId ??
              matchingOrders[0]?.supplierId ??
              null,
            supplierName: analyticsContext.supplierName ?? null,
            businessMissionId: analyticsContext.businessMissionId ?? null,
            pricingReportId:
              analyticsContext.pricingReportId ?? pricingMatch?.pricingId ?? null,
            inventoryReportId:
              analyticsContext.inventoryReportId ??
              inventoryMatch?.inventoryReportId ??
              null,
            orderReportIds: matchingOrders
              .map((r) => r.orderReportId)
              .filter((id): id is string => Boolean(id)),
            refundCaseIds: matchingCases
              .map((c) => c.caseId)
              .filter((id): id is string => Boolean(id)),
            recommendedSellingPrice: price,
            landedCost: pricingMatch?.totalLandedCost?.amount ?? null,
            targetMargin: pricingMatch?.targetMargin ?? null,
            currentStock: inventoryMatch?.currentStock ?? null,
            reorderPoint: inventoryMatch?.reorderPoint ?? null,
            stockStatus: inventoryMatch?.stockStatus ?? null,
            estimatedUnitsSold: estimatedUnitsSold || null,
            estimatedRevenue,
            estimatedOrderCount: estimatedOrderCount || null,
            estimatedIssueCount: matchingCases.length || null,
            estimatedRefundCount: refundCases.length || null,
            estimatedOnTimeFulfilments: estimatedOrderCount ? estimatedOnTime : null,
            estimatedTotalFulfilments: estimatedOrderCount || null,
            estimatedFulfilmentFailures: estimatedOrderCount ? estimatedFailures : null,
            topIssueTypes,
          }
        : null;

    if (
      !analyticsContext.productId?.trim() &&
      !analyticsContext.businessId?.trim() &&
      !analyticsContext.businessMissionId?.trim()
    ) {
      return { analyticsContext: null, enrichment };
    }
    return { analyticsContext, enrichment };
  }

  submitFindings(reports: CommerceAnalyticsReport[]): {
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
        details: "no_commerce_analytics_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q3-13",
      currentStatus: "commerce_analytics_report_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter((r) => r.productPerformanceClassification === "declining")
        .map((r) => `analytics_blocker:${r.analyticsReportId}:declining`),
      risks: reports
        .flatMap((r) =>
          r.improvementOpportunities
            .filter((o) => o.severity === "critical" || o.severity === "warning")
            .map((o) => `analytics_risk:${r.analyticsReportId}:${o.code}`),
        ),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        "await_pillow_review_of_commerce_analytics_recommendations_no_operational_changes",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      analyticsReportCount: reports.length,
      productPerformanceClassification: primary.productPerformanceClassification,
      opportunityCount: primary.improvementOpportunities.length,
      neverModifiedOperationalData: true,
      neverExecutedOptimizations: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-caw-${Date.now()}`;
    appendCawLog({
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
      workerName: COMMERCE_ANALYTICS_WORKER_IDENTITY.workerName,
      workerType: COMMERCE_ANALYTICS_WORKER_IDENTITY.workerType,
      department: COMMERCE_ANALYTICS_WORKER_IDENTITY.department,
      factory: COMMERCE_ANALYTICS_WORKER_IDENTITY.factory,
      role: COMMERCE_ANALYTICS_WORKER_IDENTITY.role,
      reportingLine: [...COMMERCE_ANALYTICS_WORKER_IDENTITY.reportingLine],
      skillProfile: [...COMMERCE_ANALYTICS_WORKER_IDENTITY.skillProfile],
      approvedTools: [...COMMERCE_ANALYTICS_WORKER_IDENTITY.approvedTools],
      authorityLevel: COMMERCE_ANALYTICS_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-13",
        requiredSkills: [...COMMERCE_ANALYTICS_WORKER_IDENTITY.skillProfile],
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
      case "pricing_worker":
        return Boolean(this.deps.pricingWorker?.getPricingReports);
      case "inventory_worker":
        return Boolean(this.deps.inventoryWorker?.getInventoryReports);
      case "order_worker":
        return Boolean(this.deps.orderWorker?.getOrderReports);
      case "refund_dispute_worker":
        return Boolean(this.deps.refundDisputeWorker?.getCases);
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
    return `Commerce Analytics Worker ${workerId} ↔ ${target} (${status})`;
  }
}
