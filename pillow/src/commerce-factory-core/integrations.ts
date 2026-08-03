import { COMMERCE_FACTORY_CORE_IDENTITY } from "./paths.js";
import type {
  CommerceBuildMission,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendCmfLog } from "./cmf-logging.js";

/** Optional live integrations for Q3-01 Commerce Factory Core. */
export type CommerceFactoryCoreDependencies = {
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
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
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
    };
  } | null;
  businessBlueprintWorker?: {
    getLatestBlueprintId?: () => string | null;
    getBlueprints?: () => unknown[];
  } | null;
  businessApprovalPackWorker?: {
    getLatestApprovalPackId?: () => string | null;
    getApprovalPacks?: () => unknown[];
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
  private deps: CommerceFactoryCoreDependencies = {};

  bind(deps: CommerceFactoryCoreDependencies = {}) {
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
      appendCmfLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  registerMission(mission: CommerceBuildMission): {
    registered: boolean;
    missionCoordinationRef: string | null;
    details: string;
  } {
    const engine = this.deps.missionCoordinationEngine;
    if (!engine?.receiveMissionPlan && !engine?.createMission) {
      return {
        registered: false,
        missionCoordinationRef: null,
        details: "mission_coordination_engine_unavailable",
      };
    }

    try {
      const result =
        engine.receiveMissionPlan?.({
          missionId: mission.commerceBuildMissionId,
          businessId: mission.businessBuildMissionId ?? mission.commerceBuildMissionId,
          phase: "commerce_preparation",
          status: "planned",
          planRef: mission.commerceBuildMissionId,
          blueprintId: mission.businessBlueprintId,
          approvalPackId: mission.businessApprovalPackId,
          validated: true,
        }) ??
        engine.createMission?.({
          missionId: mission.commerceBuildMissionId,
          businessId: mission.businessBuildMissionId ?? mission.commerceBuildMissionId,
          validated: true,
        });

      const missionCoordinationRef =
        result?.records?.find((r) => r.missionId)?.missionId ??
        result?.latestRecord?.missionId ??
        `mce-ref-${mission.commerceBuildMissionId}`;

      appendCmfLog({
        event: "register_mission",
        details: `mission=${mission.commerceBuildMissionId} mce=${missionCoordinationRef}`,
      });
      return {
        registered: true,
        missionCoordinationRef,
        details: "registered_with_mission_coordination",
      };
    } catch {
      return {
        registered: false,
        missionCoordinationRef: null,
        details: "mission_coordination_registration_failed",
      };
    }
  }

  submitMission(mission: CommerceBuildMission): {
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
      reportingEntity: mission.workerId,
      entityType: "worker",
      businessId: mission.businessBuildMissionId ?? mission.commerceBuildMissionId,
      missionId: "Q3-01",
      currentStatus: "commerce_build_mission_ready",
      progress: 100,
      blockers: mission.missingPrerequisites.slice(0, 10),
      risks: [],
      evidence: [
        ...mission.traceabilityRefs,
        `commerce_category=${mission.commerceCategory}`,
        `approval_status=${mission.approvalStatus}`,
        `mce=${mission.missionCoordinationRef ?? "none"}`,
      ],
      nextAction: "await_downstream_commerce_workers",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-cmf-${Date.now()}`;
    appendCmfLog({
      event: "submit_mission",
      details: `mission=${mission.commerceBuildMissionId} executive=${executiveReportId}`,
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
      workerName: COMMERCE_FACTORY_CORE_IDENTITY.workerName,
      workerType: COMMERCE_FACTORY_CORE_IDENTITY.workerType,
      department: COMMERCE_FACTORY_CORE_IDENTITY.department,
      factory: COMMERCE_FACTORY_CORE_IDENTITY.factory,
      role: COMMERCE_FACTORY_CORE_IDENTITY.role,
      reportingLine: [...COMMERCE_FACTORY_CORE_IDENTITY.reportingLine],
      skillProfile: [...COMMERCE_FACTORY_CORE_IDENTITY.skillProfile],
      approvedTools: [...COMMERCE_FACTORY_CORE_IDENTITY.approvedTools],
      authorityLevel: COMMERCE_FACTORY_CORE_IDENTITY.authorityLevel,
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
      case "mission_coordination_engine":
        return !!this.deps.missionCoordinationEngine;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "business_blueprint_worker":
        return !!this.deps.businessBlueprintWorker;
      case "business_approval_pack_worker":
        return !!this.deps.businessApprovalPackWorker;
      case "worker_performance_review":
        return !!this.deps.workerPerformanceReview;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; preparation-only commerce factory core under Pillow.`;
  }
}
