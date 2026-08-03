import { ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY } from "./paths.js";
import type {
  EnterprisePlatformFactoryReport,
  EnterprisePlatformMission,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendEpfcLog } from "./epfc-logging.js";

/** Optional live integrations for Q6-01 Enterprise Platform Factory Core. */
export type EnterprisePlatformFactoryCoreDependencies = {
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    registerWorker?: (input: Record<string, unknown>) => unknown;
    activateWorker?: (input: Record<string, unknown>) => unknown;
  } | null;
  workerAssignmentEngine?: {
    discoverEligibleWorkers?(input?: object): unknown;
    assignWorkers?: (input: Record<string, unknown>) => {
      assignedWorkers?: string[];
      assignedRoles?: string[];
    };
    handshake?: (input: Record<string, unknown>) => unknown;
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
  workerPerformanceReview?: {
    registerPerformanceWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  healthMonitoring?: {
    registerHealthTarget?: (input: Record<string, unknown>) => unknown;
  } | null;
  recoveryManagement?: {
    registerRecoveryTarget?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: EnterprisePlatformFactoryCoreDependencies = {};

  bind(deps: EnterprisePlatformFactoryCoreDependencies = {}) {
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
      appendEpfcLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  assignWorkers(
    mission: EnterprisePlatformMission,
    requestedWorkers: string[],
    requestedRoles: string[],
  ): { assignedWorkers: string[]; assignedWorkerRoles: string[]; details: string } {
    const engine = this.deps.workerAssignmentEngine;
    if (engine?.assignWorkers) {
      try {
        const result = engine.assignWorkers({
          missionId: mission.factoryMissionId,
          platformId: mission.platformId,
          requestedWorkers,
          requestedRoles,
          validated: true,
        });
        appendEpfcLog({
          event: "coordinate_workers",
          details: `mission=${mission.factoryMissionId} via worker_assignment_engine`,
        });
        return {
          assignedWorkers: result.assignedWorkers ?? requestedWorkers,
          assignedWorkerRoles: result.assignedRoles ?? requestedRoles,
          details: "assigned_via_worker_assignment_engine",
        };
      } catch {
        return {
          assignedWorkers: requestedWorkers,
          assignedWorkerRoles: requestedRoles,
          details: "worker_assignment_engine_failed_fallback_local",
        };
      }
    }
    if (engine?.handshake) {
      try {
        engine.handshake({
          missionId: mission.factoryMissionId,
          workerId: mission.workerId,
          validated: true,
        });
      } catch {
        /* optional */
      }
    }
    return {
      assignedWorkers: requestedWorkers,
      assignedWorkerRoles: requestedRoles,
      details: "assigned_locally",
    };
  }

  registerMission(mission: EnterprisePlatformMission): {
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
          missionId: mission.factoryMissionId,
          platformId: mission.platformId,
          phase: "enterprise_platform_orchestration",
          status: "planned",
          planRef: mission.factoryMissionId,
          platformType: mission.platformType,
          pipelineId: mission.pipelineId,
          validated: true,
        }) ??
        engine.createMission?.({
          missionId: mission.factoryMissionId,
          platformId: mission.platformId,
          validated: true,
        });

      const missionCoordinationRef =
        result?.records?.find((r) => r.missionId)?.missionId ??
        result?.latestRecord?.missionId ??
        `mce-ref-${mission.factoryMissionId}`;

      appendEpfcLog({
        event: "register_mission",
        details: `mission=${mission.factoryMissionId} mce=${missionCoordinationRef}`,
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

  submitReport(report: EnterprisePlatformFactoryReport): {
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
      reportingEntity: report.workerId,
      entityType: "worker",
      businessId: report.businessId,
      missionId: "Q6-01",
      currentStatus: report.currentLifecycleStage,
      progress: report.currentLifecycleStage === "completed" ? 100 : 50,
      blockers: [],
      risks: [],
      evidence: [
        ...report.traceabilityRefs,
        `platform_type=${report.platformType}`,
        `pipeline=${report.pipelineType}`,
        `approval_status=${report.approvalStatus}`,
        `testing_status=${report.testingStatus}`,
        `deployment_status=${report.deploymentStatus}`,
        `mce=${report.missionCoordinationRef ?? "none"}`,
      ],
      nextAction: "await_downstream_enterprise_platform_workers",
      completionStatus:
        report.currentLifecycleStage === "completed" ? "completed" : "in_progress",
      reportType: "worker",
      validated: true,
      enterprisePlatformFactoryReport: report,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-epfc-${Date.now()}`;
    appendEpfcLog({
      event: "submit_report",
      details: `mission=${report.factoryMissionId} executive=${executiveReportId}`,
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
      workerName: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.workerName,
      workerType: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.workerType,
      department: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.department,
      factory: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.factory,
      role: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.role,
      reportingLine: [...ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.reportingLine],
      skillProfile: [...ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.skillProfile],
      approvedTools: [...ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.approvedTools],
      authorityLevel: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.authorityLevel,
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
      this.deps.workerLifecycle?.registerWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
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
    try {
      this.deps.healthMonitoring?.registerHealthTarget?.({ workerId, validated: true });
    } catch {
      /* optional */
    }
    try {
      this.deps.recoveryManagement?.registerRecoveryTarget?.({ workerId, validated: true });
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
      case "mission_coordination_engine":
        return !!this.deps.missionCoordinationEngine;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_performance_review":
        return !!this.deps.workerPerformanceReview;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      case "health_monitoring":
        return !!this.deps.healthMonitoring;
      case "recovery_management":
        return !!this.deps.recoveryManagement;
      case "enterprise_platform_factory_core_validation":
        return true;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; orchestration-only enterprise platform factory core under Pillow.`;
  }
}
