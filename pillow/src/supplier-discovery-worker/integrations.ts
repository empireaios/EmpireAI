import { SUPPLIER_DISCOVERY_WORKER_IDENTITY } from "./paths.js";
import type {
  ApprovedProductInput,
  IntegrationHandshake,
  IntegrationTarget,
  SupplierDiscoveryReport,
} from "./types.js";
import { appendSdwLog } from "./sdw-logging.js";

/** Optional live workforce integrations for Q3-04 Supplier Discovery Worker. */
export type SupplierDiscoveryWorkerDependencies = {
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
  productEvaluationWorker?: {
    getEvaluations?: () => Array<{
      evaluationId?: string;
      productId?: string;
      productName?: string;
      category?: string;
      recommendation?: string;
      overallScore?: number;
      discoveryId?: string | null;
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
  private deps: SupplierDiscoveryWorkerDependencies = {};

  bind(deps: SupplierDiscoveryWorkerDependencies = {}) {
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
      appendSdwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  pullApprovedProducts(): ApprovedProductInput[] {
    const evaluations = this.deps.productEvaluationWorker?.getEvaluations?.() ?? [];
    return evaluations
      .filter((e) => !e.recommendation || e.recommendation.toLowerCase() === "proceed")
      .map((e) => ({
        evaluationId: e.evaluationId,
        productId: e.productId,
        productName: e.productName,
        category: e.category,
        recommendation: e.recommendation,
        overallScore: e.overallScore,
        discoveryId: e.discoveryId,
        businessMissionId: e.businessMissionId,
      }));
  }

  submitFindings(discoveries: SupplierDiscoveryReport[]): {
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
    const primary = discoveries[discoveries.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_discoveries_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessMissionId ?? primary.productId,
      missionId: "Q3-04",
      currentStatus: "supplier_discovery_complete",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: discoveries
        .filter((d) => d.fieldAvailability.productCost === "missing")
        .map((d) => `missing_cost:${d.supplierId}`),
      risks: [],
      evidence: discoveries.map(
        (d) => `source:${d.sourceReference}|supplier:${d.supplierName}|platform:${d.supplierPlatform}`,
      ),
      nextAction: "hand_off_candidates_to_q3_05_supplier_evaluation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      discoveryCount: discoveries.length,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-sdw-${Date.now()}`;
    appendSdwLog({
      event: "submit_findings",
      details: `discoveries=${discoveries.length} executive=${executiveReportId}`,
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
      workerName: SUPPLIER_DISCOVERY_WORKER_IDENTITY.workerName,
      workerType: SUPPLIER_DISCOVERY_WORKER_IDENTITY.workerType,
      department: SUPPLIER_DISCOVERY_WORKER_IDENTITY.department,
      factory: SUPPLIER_DISCOVERY_WORKER_IDENTITY.factory,
      role: SUPPLIER_DISCOVERY_WORKER_IDENTITY.role,
      reportingLine: [...SUPPLIER_DISCOVERY_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SUPPLIER_DISCOVERY_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SUPPLIER_DISCOVERY_WORKER_IDENTITY.approvedTools],
      authorityLevel: SUPPLIER_DISCOVERY_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-04",
        requiredSkills: [...SUPPLIER_DISCOVERY_WORKER_IDENTITY.skillProfile],
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
      case "product_evaluation_worker":
        return !!this.deps.productEvaluationWorker;
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
    return `${target} integration ${status} for ${workerId}; supplier-discovery-only worker under Pillow.`;
  }
}
