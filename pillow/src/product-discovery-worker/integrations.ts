import { PRODUCT_DISCOVERY_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  ProductDiscoveryReport,
} from "./types.js";
import { appendPdwLog } from "./pdw-logging.js";

/** Optional live workforce integrations for Q3-02 Product Discovery Worker. */
export type ProductDiscoveryWorkerDependencies = {
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
  private deps: ProductDiscoveryWorkerDependencies = {};

  bind(deps: ProductDiscoveryWorkerDependencies = {}) {
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
      appendPdwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitFindings(discoveries: ProductDiscoveryReport[]): {
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
      businessId: primary.businessMissionId,
      missionId: "Q3-02",
      currentStatus: "product_discovery_complete",
      progress: Math.round(primary.confidenceScore * 100),
      blockers: [],
      risks: discoveries
        .filter((d) => d.trendDirection === "declining")
        .map((d) => `declining:${d.productName}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "hand_off_candidates_to_q3_03_evaluation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      discoveryCount: discoveries.length,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-pdw-${Date.now()}`;
    appendPdwLog({
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
      workerName: PRODUCT_DISCOVERY_WORKER_IDENTITY.workerName,
      workerType: PRODUCT_DISCOVERY_WORKER_IDENTITY.workerType,
      department: PRODUCT_DISCOVERY_WORKER_IDENTITY.department,
      factory: PRODUCT_DISCOVERY_WORKER_IDENTITY.factory,
      role: PRODUCT_DISCOVERY_WORKER_IDENTITY.role,
      reportingLine: [...PRODUCT_DISCOVERY_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PRODUCT_DISCOVERY_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PRODUCT_DISCOVERY_WORKER_IDENTITY.approvedTools],
      authorityLevel: PRODUCT_DISCOVERY_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-02",
        requiredSkills: [...PRODUCT_DISCOVERY_WORKER_IDENTITY.skillProfile],
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
    return `${target} integration ${status} for ${workerId}; discovery-only worker under Pillow.`;
  }
}
