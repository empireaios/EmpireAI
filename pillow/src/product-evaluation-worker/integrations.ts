import { PRODUCT_EVALUATION_WORKER_IDENTITY } from "./paths.js";
import type {
  DiscoveredProductInput,
  IntegrationHandshake,
  IntegrationTarget,
  ProductEvaluationReport,
} from "./types.js";
import { appendPewLog } from "./pew-logging.js";

/** Optional live workforce integrations for Q3-03 Product Evaluation Worker. */
export type ProductEvaluationWorkerDependencies = {
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
  productDiscoveryWorker?: {
    getDiscoveries?: () => Array<{
      discoveryId?: string;
      productId?: string;
      productName?: string;
      category?: string;
      discoverySource?: string;
      marketplace?: string | null;
      supplier?: string | null;
      searchTrendSignals?: string[];
      customerDemandSignals?: string[];
      discoveryReason?: string;
      confidenceScore?: number;
      trendDirection?: string;
      businessMissionId?: string;
      supportingEvidence?: Array<{
        source?: string;
        claim?: string;
        kind?: string;
        relatedTopic?: string;
      }>;
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
  private deps: ProductEvaluationWorkerDependencies = {};

  bind(deps: ProductEvaluationWorkerDependencies = {}) {
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
      appendPewLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  pullDiscoveredProducts(): DiscoveredProductInput[] {
    const discoveries = this.deps.productDiscoveryWorker?.getDiscoveries?.() ?? [];
    return discoveries.map((d) => ({
      discoveryId: d.discoveryId,
      productId: d.productId,
      productName: d.productName,
      category: d.category,
      discoverySource: d.discoverySource,
      marketplace: d.marketplace,
      supplier: d.supplier,
      searchTrendSignals: d.searchTrendSignals,
      customerDemandSignals: d.customerDemandSignals,
      discoveryReason: d.discoveryReason,
      confidenceScore: d.confidenceScore,
      trendDirection: d.trendDirection,
      businessMissionId: d.businessMissionId,
      supportingEvidence: d.supportingEvidence,
    }));
  }

  submitFindings(evaluations: ProductEvaluationReport[]): {
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
      missionId: "Q3-03",
      currentStatus: "product_evaluation_complete",
      progress: Math.round(primary.overallScore),
      blockers: evaluations
        .filter((e) => e.recommendation === "Reject")
        .map((e) => `reject:${e.productName}`),
      risks: evaluations
        .filter((e) => e.riskScore < 40)
        .map((e) => `low_risk_score:${e.productName}:${e.riskScore}`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction:
        primary.recommendation === "Proceed"
          ? "hand_off_to_q3_04_supplier_selection"
          : primary.recommendation === "Review"
            ? "await_pillow_review"
            : "archive_rejected_product",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      evaluationCount: evaluations.length,
      recommendation: primary.recommendation,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-pew-${Date.now()}`;
    appendPewLog({
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
      workerName: PRODUCT_EVALUATION_WORKER_IDENTITY.workerName,
      workerType: PRODUCT_EVALUATION_WORKER_IDENTITY.workerType,
      department: PRODUCT_EVALUATION_WORKER_IDENTITY.department,
      factory: PRODUCT_EVALUATION_WORKER_IDENTITY.factory,
      role: PRODUCT_EVALUATION_WORKER_IDENTITY.role,
      reportingLine: [...PRODUCT_EVALUATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PRODUCT_EVALUATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PRODUCT_EVALUATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: PRODUCT_EVALUATION_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q3-03",
        requiredSkills: [...PRODUCT_EVALUATION_WORKER_IDENTITY.skillProfile],
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
      case "product_discovery_worker":
        return !!this.deps.productDiscoveryWorker;
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
    return `${target} integration ${status} for ${workerId}; evaluation-only worker under Pillow.`;
  }
}
