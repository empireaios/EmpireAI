import { BUSINESS_APPROVAL_PACK_WORKER_IDENTITY } from "./paths.js";
import type {
  BusinessApprovalPack,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendBapLog } from "./bap-logging.js";

/** Optional live workforce / planning integrations for Q2-09 Business Approval Pack Worker. */
export type BusinessApprovalPackWorkerDependencies = {
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
    };
  } | null;
  businessModelGenerator?: {
    getLatestBusinessModelId?: () => string | null;
    getBusinessModels?: () => unknown[];
    getLatestModelId?: () => string | null;
    getModels?: () => unknown[];
  } | null;
  marketResearchWorker?: {
    getLatestReportId?: () => string | null;
    getReports?: () => unknown[];
  } | null;
  opportunityEvaluationWorker?: {
    getLatestEvaluationId?: () => string | null;
    getEvaluations?: () => unknown[];
  } | null;
  businessBlueprintWorker?: {
    getLatestBlueprintId?: () => string | null;
    getBlueprints?: () => unknown[];
  } | null;
  launchPlanWorker?: {
    getLatestLaunchPlanId?: () => string | null;
    getLaunchPlans?: () => unknown[];
  } | null;
  businessRiskWorker?: {
    getLatestRiskReportId?: () => string | null;
    getRiskReports?: () => unknown[];
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
  private deps: BusinessApprovalPackWorkerDependencies = {};

  bind(deps: BusinessApprovalPackWorkerDependencies = {}) {
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
      appendBapLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitApprovalPack(pack: BusinessApprovalPack): {
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

    const result = runtime.submitWorkerReport({
      reportingEntity: pack.workerId,
      entityType: "worker",
      businessId: pack.businessBuildMissionId,
      missionId: "Q2-09",
      currentStatus: "business_approval_pack_ready",
      progress: 100,
      blockers: pack.outstandingIssues.slice(0, 10),
      risks: pack.majorRisks.slice(0, 10),
      evidence: [
        ...pack.traceabilityRefs,
        `recommendation=${pack.recommendation}`,
        `major_opportunities=${pack.majorOpportunities.length}`,
        `required_gk_decisions=${pack.requiredGrandKingDecisions.length}`,
      ],
      nextAction: "await_pillow_and_grand_king_approval_decision",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-bap-${Date.now()}`;
    appendBapLog({
      event: "submit_approval_pack",
      details: `pack=${pack.approvalPackId} executive=${executiveReportId}`,
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
      workerName: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.workerName,
      workerType: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.workerType,
      department: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.department,
      factory: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.factory,
      role: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.role,
      reportingLine: [...BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.reportingLine],
      skillProfile: [...BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.skillProfile],
      approvedTools: [...BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.approvedTools],
      authorityLevel: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };

    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* optional */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q2-09",
        requiredSkills: [...BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerPerformanceReview?.registerPerformanceWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* optional */
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
      case "business_model_generator":
        return !!this.deps.businessModelGenerator;
      case "market_research_worker":
        return !!this.deps.marketResearchWorker;
      case "opportunity_evaluation_worker":
        return !!this.deps.opportunityEvaluationWorker;
      case "business_blueprint_worker":
        return !!this.deps.businessBlueprintWorker;
      case "launch_plan_worker":
        return !!this.deps.launchPlanWorker;
      case "business_risk_worker":
        return !!this.deps.businessRiskWorker;
      case "worker_performance_review":
        return !!this.deps.workerPerformanceReview;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; packaging-only approval pack worker under Pillow.`;
  }
}
