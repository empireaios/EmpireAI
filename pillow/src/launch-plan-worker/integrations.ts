import { LAUNCH_PLAN_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  LaunchPlan,
} from "./types.js";
import { appendLpwLog } from "./lpw-logging.js";

/** Optional live workforce / coordination integrations for Q2-07 Launch Plan Worker. */
export type LaunchPlanWorkerDependencies = {
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
  businessBlueprintWorker?: {
    getLatestBlueprintId?: () => string | null;
    getBlueprints?: () => unknown[];
  } | null;
  missionCoordinationEngine?: {
    receiveMissionPlan?: (input: Record<string, unknown>) => {
      records?: Array<{ missionId?: string }>;
      latestRecord?: { missionId?: string } | null;
    };
    createMission?: (input: Record<string, unknown>) => {
      records?: Array<{ missionId?: string }>;
      latestRecord?: { missionId?: string } | null;
    };
  } | null;
  approvalRouter?: {
    generateApprovalRequest?(input?: object): {
      requests?: Array<{ requestId?: string }>;
      latestRequest?: { requestId?: string } | null;
    };
    evaluateRequest?(input?: object): unknown;
  } | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
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
  private deps: LaunchPlanWorkerDependencies = {};

  bind(deps: LaunchPlanWorkerDependencies = {}) {
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
      appendLpwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitLaunchPlan(plan: LaunchPlan): {
    submitted: boolean;
    executiveReportId: string | null;
    missionCoordinationRef: string | null;
    approvalRouterRef: string | null;
    details: string;
  } {
    let missionCoordinationRef: string | null = null;
    let approvalRouterRef: string | null = null;

    try {
      const missionResult =
        this.deps.missionCoordinationEngine?.receiveMissionPlan?.({
          missionId: plan.businessBuildMissionId,
          businessId: plan.businessBuildMissionId,
          phase: "planning",
          status: "planned",
          planRef: plan.launchPlanId,
          validated: true,
        }) ??
        this.deps.missionCoordinationEngine?.createMission?.({
          missionId: plan.businessBuildMissionId,
          businessId: plan.businessBuildMissionId,
          validated: true,
        });
      missionCoordinationRef =
        missionResult?.records?.find((r) => r.missionId)?.missionId ??
        missionResult?.latestRecord?.missionId ??
        `mce-ref-${plan.launchPlanId}`;
    } catch {
      missionCoordinationRef = null;
    }

    try {
      const approvalResult = this.deps.approvalRouter?.generateApprovalRequest?.({
        requestType: "launch_readiness_checkpoint",
        missionId: plan.businessBuildMissionId,
        subjectId: plan.launchPlanId,
        requestedAuthority: "pillow",
        evidence: plan.approvalCheckpoints.map((c) => c.checkpointId),
        validated: true,
      });
      approvalRouterRef =
        approvalResult?.requests?.find((r) => r.requestId)?.requestId ??
        approvalResult?.latestRequest?.requestId ??
        `apr-ref-${plan.launchPlanId}`;
    } catch {
      approvalRouterRef = null;
    }

    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return {
        submitted: false,
        executiveReportId: null,
        missionCoordinationRef,
        approvalRouterRef,
        details: "executive_reporting_runtime_unavailable",
      };
    }

    const result = runtime.submitWorkerReport({
      reportingEntity: plan.workerId,
      entityType: "worker",
      businessId: plan.businessBuildMissionId,
      missionId: "Q2-07",
      currentStatus: "launch_plan_ready",
      progress: 100,
      blockers: plan.blockers.map((b) => `${b.severity}:${b.description}`),
      risks: plan.rollbackConditions.map((r) => `${r.action}:${r.trigger}`),
      evidence: [
        ...plan.traceabilityRefs,
        `stages=${plan.launchStages.map((s) => s.stageKey).join("|")}`,
        `approvals=${plan.approvalCheckpoints.length}`,
        `validations=${plan.validationCheckpoints.length}`,
      ],
      nextAction: "await_downstream_execution_from_launch_plan",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lpw-${Date.now()}`;
    appendLpwLog({
      event: "submit_launch_plan",
      details: `plan=${plan.launchPlanId} executive=${executiveReportId}`,
    });
    return {
      submitted: true,
      executiveReportId,
      missionCoordinationRef,
      approvalRouterRef,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: LAUNCH_PLAN_WORKER_IDENTITY.workerName,
      workerType: LAUNCH_PLAN_WORKER_IDENTITY.workerType,
      department: LAUNCH_PLAN_WORKER_IDENTITY.department,
      factory: LAUNCH_PLAN_WORKER_IDENTITY.factory,
      role: LAUNCH_PLAN_WORKER_IDENTITY.role,
      reportingLine: [...LAUNCH_PLAN_WORKER_IDENTITY.reportingLine],
      skillProfile: [...LAUNCH_PLAN_WORKER_IDENTITY.skillProfile],
      approvedTools: [...LAUNCH_PLAN_WORKER_IDENTITY.approvedTools],
      authorityLevel: LAUNCH_PLAN_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q2-07",
        requiredSkills: [...LAUNCH_PLAN_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* optional — discover only, never assign */
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
      case "business_blueprint_worker":
        return !!this.deps.businessBlueprintWorker;
      case "mission_coordination_engine":
        return !!this.deps.missionCoordinationEngine;
      case "approval_router":
        return !!this.deps.approvalRouter;
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
    return `${target} integration ${status} for ${workerId}; planning-only launch worker under Pillow.`;
  }
}
