import { SUPPLIER_NEGOTIATION_WORKER_IDENTITY } from "./paths.js";
import type {
  EvaluatedSupplierInput,
  IntegrationHandshake,
  IntegrationTarget,
  SupplierNegotiationReport,
} from "./types.js";
import { appendSnwLog } from "./snw-logging.js";

/** Optional live workforce integrations for Q3-06 Supplier Negotiation Worker. */
export type SupplierNegotiationWorkerDependencies = {
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
      reliabilityScore?: number;
      priceScore?: number;
      shippingScore?: number;
      refundPolicyScore?: number;
      fulfilmentQualityScore?: number;
      communicationScore?: number;
      riskScore?: number;
      overallScore?: number;
      recommendation?: string;
      confidenceScore?: number;
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
  private deps: SupplierNegotiationWorkerDependencies = {};

  bind(deps: SupplierNegotiationWorkerDependencies = {}) {
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
      appendSnwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  pullEvaluatedSuppliers(): EvaluatedSupplierInput[] {
    const evaluations = this.deps.supplierEvaluationWorker?.getEvaluations?.() ?? [];
    return evaluations.map((e) => ({
      evaluationId: e.evaluationId,
      discoveryId: e.discoveryId,
      supplierId: e.supplierId,
      supplierName: e.supplierName,
      productId: e.productId,
      productName: e.productName,
      reliabilityScore: e.reliabilityScore,
      priceScore: e.priceScore,
      shippingScore: e.shippingScore,
      refundPolicyScore: e.refundPolicyScore,
      fulfilmentQualityScore: e.fulfilmentQualityScore,
      communicationScore: e.communicationScore,
      riskScore: e.riskScore,
      overallScore: e.overallScore,
      recommendation: e.recommendation,
      confidenceScore: e.confidenceScore,
      businessMissionId: e.businessMissionId,
    }));
  }

  submitFindings(negotiations: SupplierNegotiationReport[]): {
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
    const primary = negotiations[negotiations.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_negotiations_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-06",
      currentStatus: "supplier_negotiation_prepared",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: negotiations
        .filter((n) => n.recommendation === "Defer")
        .map((n) => `defer:${n.productName}`),
      risks: negotiations
        .filter((n) => !n.preferredSupplier)
        .map((n) => `no_preferred:${n.negotiationId}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        primary.recommendation === "Prefer"
          ? "await_pillow_approval_to_transmit_draft"
          : primary.recommendation === "Review"
            ? "await_pillow_review_of_candidates"
            : "archive_deferred_negotiation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      negotiationCount: negotiations.length,
      recommendation: primary.recommendation,
      preferredSupplierId: primary.preferredSupplier?.supplierId ?? null,
      neverContactedSuppliers: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-snw-${Date.now()}`;
    appendSnwLog({
      event: "submit_findings",
      details: `negotiations=${negotiations.length} executive=${executiveReportId}`,
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
      workerName: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.workerName,
      workerType: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.workerType,
      department: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.department,
      factory: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.factory,
      role: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.role,
      reportingLine: [...SUPPLIER_NEGOTIATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SUPPLIER_NEGOTIATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SUPPLIER_NEGOTIATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: SUPPLIER_NEGOTIATION_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-06",
        requiredSkills: [...SUPPLIER_NEGOTIATION_WORKER_IDENTITY.skillProfile],
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
    return `Supplier Negotiation Worker ${workerId} ↔ ${target} (${status})`;
  }
}
