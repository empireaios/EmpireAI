import { SUPPLIER_EVALUATION_WORKER_IDENTITY } from "./paths.js";
import type {
  DiscoveredSupplierInput,
  IntegrationHandshake,
  IntegrationTarget,
  SupplierEvaluationReport,
} from "./types.js";
import { appendSewLog } from "./sew-logging.js";

/** Optional live workforce integrations for Q3-05 Supplier Evaluation Worker. */
export type SupplierEvaluationWorkerDependencies = {
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
  supplierDiscoveryWorker?: {
    getDiscoveries?: () => Array<{
      discoveryId?: string;
      productId?: string;
      productName?: string;
      supplierId?: string;
      supplierName?: string;
      supplierPlatform?: string;
      productCost?: number | null;
      moq?: number | null;
      shippingAvailability?: string | null;
      supplierLocation?: string | null;
      sourceReference?: string;
      confidenceScore?: number;
      discoveryChannel?: string;
      supplierApi?: string | null;
      evaluationId?: string | null;
      businessMissionId?: string | null;
      fieldAvailability?: {
        productCost?: string;
        moq?: string;
        shippingAvailability?: string;
        supplierLocation?: string;
      };
    }>;
    getLatestDiscoveryId?: () => string | null;
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
  private deps: SupplierEvaluationWorkerDependencies = {};

  bind(deps: SupplierEvaluationWorkerDependencies = {}) {
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
      appendSewLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  pullDiscoveredSuppliers(): DiscoveredSupplierInput[] {
    const discoveries = this.deps.supplierDiscoveryWorker?.getDiscoveries?.() ?? [];
    return discoveries.map((d) => ({
      discoveryId: d.discoveryId,
      productId: d.productId,
      productName: d.productName,
      supplierId: d.supplierId,
      supplierName: d.supplierName,
      supplierPlatform: d.supplierPlatform,
      productCost: d.productCost,
      moq: d.moq,
      shippingAvailability: d.shippingAvailability,
      supplierLocation: d.supplierLocation,
      sourceReference: d.sourceReference,
      confidenceScore: d.confidenceScore,
      discoveryChannel: d.discoveryChannel,
      supplierApi: d.supplierApi,
      evaluationId: d.evaluationId,
      businessMissionId: d.businessMissionId,
      fieldAvailability: d.fieldAvailability,
    }));
  }

  submitFindings(evaluations: SupplierEvaluationReport[]): {
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
    const primary = evaluations[evaluations.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_evaluations_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-05",
      currentStatus: "supplier_evaluation_complete",
      progress: Math.round(primary.overallScore),
      blockers: evaluations
        .filter((e) => e.recommendation === "Reject")
        .map((e) => `reject:${e.supplierName}`),
      risks: evaluations
        .filter((e) => e.riskScore < 40)
        .map((e) => `low_risk_score:${e.supplierName}:${e.riskScore}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        primary.recommendation === "Approve"
          ? "hand_off_to_q3_06_supplier_selection"
          : primary.recommendation === "Review"
            ? "await_pillow_review"
            : "archive_rejected_supplier",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      evaluationCount: evaluations.length,
      recommendation: primary.recommendation,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-sew-${Date.now()}`;
    appendSewLog({
      event: "submit_findings",
      details: `evaluations=${evaluations.length} executive=${executiveReportId}`,
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
      workerName: SUPPLIER_EVALUATION_WORKER_IDENTITY.workerName,
      workerType: SUPPLIER_EVALUATION_WORKER_IDENTITY.workerType,
      department: SUPPLIER_EVALUATION_WORKER_IDENTITY.department,
      factory: SUPPLIER_EVALUATION_WORKER_IDENTITY.factory,
      role: SUPPLIER_EVALUATION_WORKER_IDENTITY.role,
      reportingLine: [...SUPPLIER_EVALUATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SUPPLIER_EVALUATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SUPPLIER_EVALUATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: SUPPLIER_EVALUATION_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-05",
        requiredSkills: [...SUPPLIER_EVALUATION_WORKER_IDENTITY.skillProfile],
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
      /* performance optional during isolated tests */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* recovery optional during isolated tests */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
      case "worker_assignment_engine":
        return !!this.deps.workerAssignmentEngine;
      case "supplier_discovery_worker":
        return !!this.deps.supplierDiscoveryWorker;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_performance_review":
        return !!this.deps.workerPerformanceReview;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; supplier-evaluation-only worker under Pillow.`;
  }
}
