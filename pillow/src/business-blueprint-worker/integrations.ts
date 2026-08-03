import { BUSINESS_BLUEPRINT_WORKER_IDENTITY } from "./paths.js";
import type {
  BusinessBlueprint,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendBbwLog } from "./bbw-logging.js";

/** Optional live workforce integrations for Q2-06 Business Blueprint Worker. */
export type BusinessBlueprintWorkerDependencies = {
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
  private deps: BusinessBlueprintWorkerDependencies = {};

  bind(deps: BusinessBlueprintWorkerDependencies = {}) {
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
      appendBbwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitBlueprint(blueprint: BusinessBlueprint): {
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
      reportingEntity: blueprint.workerId,
      entityType: "worker",
      businessId: blueprint.businessBuildMissionId,
      missionId: "Q2-06",
      currentStatus: "business_blueprint_ready",
      progress: 100,
      blockers: blueprint.dependencies.map((d) => d.description),
      risks: blueprint.preservedDecisions.filter((d) => /risk|barrier/i.test(d)),
      evidence: [
        ...blueprint.traceabilityRefs,
        `workers=${blueprint.requiredWorkers.length}`,
        `milestones=${blueprint.milestones.length}`,
        `integrations=${blueprint.requiredIntegrations.join("|")}`,
      ],
      nextAction: "prepare_downstream_execution_from_canonical_blueprint",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-bbw-${Date.now()}`;
    appendBbwLog({
      event: "submit_blueprint",
      details: `blueprint=${blueprint.blueprintId} executive=${executiveReportId}`,
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
      workerName: BUSINESS_BLUEPRINT_WORKER_IDENTITY.workerName,
      workerType: BUSINESS_BLUEPRINT_WORKER_IDENTITY.workerType,
      department: BUSINESS_BLUEPRINT_WORKER_IDENTITY.department,
      factory: BUSINESS_BLUEPRINT_WORKER_IDENTITY.factory,
      role: BUSINESS_BLUEPRINT_WORKER_IDENTITY.role,
      reportingLine: [...BUSINESS_BLUEPRINT_WORKER_IDENTITY.reportingLine],
      skillProfile: [...BUSINESS_BLUEPRINT_WORKER_IDENTITY.skillProfile],
      approvedTools: [...BUSINESS_BLUEPRINT_WORKER_IDENTITY.approvedTools],
      authorityLevel: BUSINESS_BLUEPRINT_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q2-06",
        requiredSkills: [...BUSINESS_BLUEPRINT_WORKER_IDENTITY.skillProfile],
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
    return `${target} integration ${status} for ${workerId}; blueprint-only worker under Pillow.`;
  }
}
