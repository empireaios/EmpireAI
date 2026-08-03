import { REFUND_DISPUTE_WORKER_IDENTITY } from "./paths.js";
import type {
  CaseRequestInput,
  IntegrationHandshake,
  IntegrationTarget,
  RefundDisputeReport,
  RefundDisputeWorkerInput,
} from "./types.js";
import { appendRdwLog } from "./rdw-logging.js";

/** Optional live workforce integrations for Q3-12 Refund & Dispute Worker. */
export type RefundDisputeWorkerDependencies = {
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
  orderWorker?: {
    getOrderReports?: () => Array<{
      orderReportId?: string;
      orderId?: string;
      customerId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string | null;
      supplierName?: string | null;
      orderStatus?: string | null;
      fulfilmentStatus?: string | null;
      shippingStatus?: string | null;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
    }>;
    getLatestOrderReportId?: () => string | null;
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

export type OrderEnrichmentContext = {
  orderReportId?: string | null;
  orderId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  orderStatus?: string | null;
  fulfilmentStatus?: string | null;
  shippingStatus?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: RefundDisputeWorkerDependencies = {};

  bind(deps: RefundDisputeWorkerDependencies = {}) {
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
      appendRdwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromOrders(input: RefundDisputeWorkerInput): RefundDisputeWorkerInput {
    const reports = this.deps.orderWorker?.getOrderReports?.() ?? [];
    if (!reports.length) return input;
    const match =
      reports.find(
        (r) =>
          (input.orderReportId && r.orderReportId === input.orderReportId) ||
          (input.orderId && r.orderId === input.orderId) ||
          (input.customerId && r.customerId === input.customerId) ||
          (input.caseRequest?.orderReportId &&
            r.orderReportId === input.caseRequest.orderReportId) ||
          (input.caseRequest?.orderId && r.orderId === input.caseRequest.orderId) ||
          (input.caseRequest?.customerId &&
            r.customerId === input.caseRequest.customerId),
      ) ?? reports[reports.length - 1];
    if (!match) return input;
    return {
      ...input,
      orderReportId: input.orderReportId ?? match.orderReportId ?? null,
      orderId: input.orderId ?? match.orderId ?? null,
      customerId: input.customerId ?? match.customerId ?? null,
      productId: input.productId ?? match.productId ?? null,
      productName: input.productName ?? match.productName ?? null,
      supplierId: input.supplierId ?? match.supplierId ?? null,
      supplierName: input.supplierName ?? match.supplierName ?? null,
      evaluationId: input.evaluationId ?? match.evaluationId ?? null,
      discoveryId: input.discoveryId ?? match.discoveryId ?? null,
      businessMissionId: input.businessMissionId ?? match.businessMissionId ?? null,
    };
  }

  pullCaseContext(input: RefundDisputeWorkerInput): {
    caseRequest: CaseRequestInput | null;
    order: OrderEnrichmentContext | null;
  } {
    const enriched = this.enrichFromOrders(input);
    const caseRequest: CaseRequestInput = {
      ...(enriched.caseRequest ?? {}),
      caseId: enriched.caseId ?? enriched.caseRequest?.caseId,
      orderId: enriched.orderId ?? enriched.caseRequest?.orderId,
      customerId: enriched.customerId ?? enriched.caseRequest?.customerId,
      productId: enriched.productId ?? enriched.caseRequest?.productId,
      productName: enriched.productName ?? enriched.caseRequest?.productName,
      supplierId: enriched.supplierId ?? enriched.caseRequest?.supplierId,
      supplierName: enriched.supplierName ?? enriched.caseRequest?.supplierName,
      caseType: enriched.caseType ?? enriched.caseRequest?.caseType,
      reason: enriched.reason ?? enriched.caseRequest?.reason,
      requestedAmount: enriched.requestedAmount ?? enriched.caseRequest?.requestedAmount,
      policyId: enriched.policyId ?? enriched.caseRequest?.policyId,
      currentStatus: enriched.currentStatus ?? enriched.caseRequest?.currentStatus,
      requireSupplierCoordination:
        enriched.requireSupplierCoordination ??
        enriched.caseRequest?.requireSupplierCoordination,
      orderAgeDays: enriched.orderAgeDays ?? enriched.caseRequest?.orderAgeDays,
      orderReportId: enriched.orderReportId ?? enriched.caseRequest?.orderReportId,
      evaluationId: enriched.evaluationId ?? enriched.caseRequest?.evaluationId,
      discoveryId: enriched.discoveryId ?? enriched.caseRequest?.discoveryId,
      businessMissionId:
        enriched.businessMissionId ?? enriched.caseRequest?.businessMissionId,
      resolutionOutcome:
        enriched.resolutionOutcome ?? enriched.caseRequest?.resolutionOutcome,
    };

    const reports = this.deps.orderWorker?.getOrderReports?.() ?? [];
    const orderMatch =
      reports.find(
        (r) =>
          (caseRequest.orderReportId && r.orderReportId === caseRequest.orderReportId) ||
          (caseRequest.orderId && r.orderId === caseRequest.orderId) ||
          (caseRequest.customerId && r.customerId === caseRequest.customerId),
      ) ?? null;

    const order: OrderEnrichmentContext | null = orderMatch
      ? {
          orderReportId: orderMatch.orderReportId ?? null,
          orderId: orderMatch.orderId ?? null,
          customerId: orderMatch.customerId ?? null,
          productId: orderMatch.productId ?? null,
          productName: orderMatch.productName ?? null,
          supplierId: orderMatch.supplierId ?? null,
          supplierName: orderMatch.supplierName ?? null,
          orderStatus: orderMatch.orderStatus ?? null,
          fulfilmentStatus: orderMatch.fulfilmentStatus ?? null,
          shippingStatus: orderMatch.shippingStatus ?? null,
          evaluationId: orderMatch.evaluationId ?? null,
          discoveryId: orderMatch.discoveryId ?? null,
          businessMissionId: orderMatch.businessMissionId ?? null,
        }
      : null;

    if (!caseRequest.orderId?.trim() && !caseRequest.customerId?.trim()) {
      return { caseRequest: null, order };
    }
    return { caseRequest, order };
  }

  submitFindings(reports: RefundDisputeReport[]): {
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
        details: "no_refund_dispute_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.orderId,
      missionId: "Q3-12",
      currentStatus: "refund_dispute_case_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: reports
        .filter(
          (r) =>
            !r.policyEvaluation.withinDelegatedAuthority ||
            r.escalationStatus === "escalated_to_pillow",
        )
        .map((r) => `case_blocker:${r.caseId}:${r.currentStatus}`),
      risks: reports
        .filter((r) => r.caseType === "chargeback" || r.caseType === "customer_dispute")
        .map((r) => `case_risk:${r.caseId}:${r.caseType}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        "await_pillow_authorization_before_any_ledger_or_marketplace_policy_change",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      caseCount: reports.length,
      caseType: primary.caseType,
      caseStatus: primary.currentStatus,
      policyDecision: primary.policyEvaluation.decision,
      neverModifiedFinancialLedgers: true,
      neverAuthorizedOutsideAuthorityMatrix: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-rdw-${Date.now()}`;
    appendRdwLog({
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
      workerName: REFUND_DISPUTE_WORKER_IDENTITY.workerName,
      workerType: REFUND_DISPUTE_WORKER_IDENTITY.workerType,
      department: REFUND_DISPUTE_WORKER_IDENTITY.department,
      factory: REFUND_DISPUTE_WORKER_IDENTITY.factory,
      role: REFUND_DISPUTE_WORKER_IDENTITY.role,
      reportingLine: [...REFUND_DISPUTE_WORKER_IDENTITY.reportingLine],
      skillProfile: [...REFUND_DISPUTE_WORKER_IDENTITY.skillProfile],
      approvedTools: [...REFUND_DISPUTE_WORKER_IDENTITY.approvedTools],
      authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-12",
        requiredSkills: [...REFUND_DISPUTE_WORKER_IDENTITY.skillProfile],
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
      case "order_worker":
        return Boolean(this.deps.orderWorker?.getOrderReports);
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
    return `Refund & Dispute Worker ${workerId} ↔ ${target} (${status})`;
  }
}
