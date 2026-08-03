import type { FrontendBuildReport, FrontendWorkerInput, IntegrationHandshake, IntegrationTarget } from "./types.js";
import { FRONTEND_WORKER_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import { appendFewLog } from "./few-logging.js";

export type RequirementsWorker = {
  getRequirementsReports?: () => Array<{
    requirementsId?: string;
    platformId?: string;
    platformName?: string;
    businessId?: string;
    factoryMissionId?: string;
    businessObjective?: string;
  }>;
  getLatestRequirementsReportId?: () => string | null;
};

export type ArchitectureWorkerSurface = {
  getArchitectureReports?: () => Array<{
    architectureId?: string;
    platformId?: string;
    platformName?: string;
    businessId?: string;
    factoryMissionId?: string;
    businessObjective?: string;
    requirementsReportId?: string;
    moduleArchitecture?: Array<{ moduleId?: string; name?: string; responsibility?: string }>;
    apiArchitecture?: Array<{
      apiId?: string;
      name?: string;
      protocol?: string;
      endpoints?: string[];
      direction?: string;
    }>;
  }>;
  getLatestArchitectureReportId?: () => string | null;
};

export type FrontendWorkerDependencies = {
  workerRegistry?: { registerWorker: (input: Record<string, unknown>) => unknown } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerAssignmentEngine?: {
    discoverEligibleWorkers: (input: Record<string, unknown>) => unknown;
  } | null;
  enterprisePlatformFactoryCore?: {
    getMissions?: () => Array<{
      factoryMissionId?: string;
      platformId?: string;
      platformName?: string;
      businessId?: string;
      businessObjective?: string;
    }>;
    getLatestMissionId?: () => string | null;
  } | null;
  requirementsWorker?: RequirementsWorker | null;
  architectureWorker?: ArchitectureWorkerSurface | null;
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
  private deps: FrontendWorkerDependencies = {};
  private handshakes: IntegrationHandshake[] = [];

  bind(deps: FrontendWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  connect(workerId: string) {
    const now = new Date().toISOString();
    this.handshakes = INTEGRATION_TARGETS.map((target) => {
      const status = this.bound(target) ? "bound" : "ready";
      appendFewLog({ event: "integration_handshake", details: `${target}:${status}` });
      return {
        target,
        status,
        details: `Frontend Worker ${workerId} ↔ ${target} (${status})`,
        timestamp: now,
      };
    });
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  enrich(input: FrontendWorkerInput) {
    const reqReports = this.deps.requirementsWorker?.getRequirementsReports?.() ?? [];
    const req =
      reqReports.find((r) => r.requirementsId === input.requirementsReportId) ??
      reqReports.at(-1);
    const archReports = this.deps.architectureWorker?.getArchitectureReports?.() ?? [];
    const arch =
      archReports.find(
        (r) =>
          r.architectureId === input.architectureReportId ||
          r.platformId === input.platformId ||
          r.businessId === input.businessId,
      ) ?? archReports.at(-1);
    const missions = this.deps.enterprisePlatformFactoryCore?.getMissions?.() ?? [];
    const mission =
      missions.find(
        (m) =>
          m.factoryMissionId === input.factoryMissionId ||
          m.platformId === input.platformId ||
          m.businessId === input.businessId,
      ) ?? missions.at(-1);

    return {
      input: {
        ...input,
        requirementsReportId:
          input.requirementsReportId ??
          req?.requirementsId ??
          this.deps.requirementsWorker?.getLatestRequirementsReportId?.() ??
          null,
        architectureReportId:
          input.architectureReportId ??
          arch?.architectureId ??
          this.deps.architectureWorker?.getLatestArchitectureReportId?.() ??
          null,
        platformId:
          input.platformId ?? arch?.platformId ?? req?.platformId ?? mission?.platformId ?? null,
        platformName:
          input.platformName ??
          arch?.platformName ??
          req?.platformName ??
          mission?.platformName ??
          null,
        businessId:
          input.businessId ?? arch?.businessId ?? req?.businessId ?? mission?.businessId ?? null,
        factoryMissionId:
          input.factoryMissionId ??
          arch?.factoryMissionId ??
          req?.factoryMissionId ??
          mission?.factoryMissionId ??
          this.deps.enterprisePlatformFactoryCore?.getLatestMissionId?.() ??
          null,
        businessObjective:
          input.businessObjective ??
          arch?.businessObjective ??
          req?.businessObjective ??
          mission?.businessObjective ??
          null,
      },
      architecture: arch,
    };
  }

  submitReport(report: FrontendBuildReport) {
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
      missionId: "Q6-04",
      currentStatus: "frontend_build_report_prepared",
      progress: Math.round(report.confidenceScore),
      blockers: report.selfReviewPassed ? [] : [`self_review_blocker:${report.buildId}`],
      evidence: [
        `requirements:${report.requirementsReportId}`,
        `architecture:${report.architectureReportId}`,
        `pages:${report.pagesCreated.length}`,
        `dashboards:${report.dashboardsCreated.length}`,
        `forms:${report.formsCreated.length}`,
      ],
      nextAction: "awaiting_pillow_review_of_frontend_build_no_backend_or_deployment",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      neverImplementedBackendBusinessLogic: true,
      neverDesignedDatabases: true,
      neverDeployedApplications: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-few-${Date.now()}`;
    appendFewLog({
      event: "submit_report",
      details: `build=${report.buildId} executive=${executiveReportId}`,
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
      workerName: FRONTEND_WORKER_IDENTITY.workerName,
      workerType: FRONTEND_WORKER_IDENTITY.workerType,
      department: FRONTEND_WORKER_IDENTITY.department,
      factory: FRONTEND_WORKER_IDENTITY.factory,
      role: FRONTEND_WORKER_IDENTITY.role,
      reportingLine: [...FRONTEND_WORKER_IDENTITY.reportingLine],
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
        missionId: "Q6-04",
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

  private bound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return Boolean(this.deps.workerRegistry?.registerWorker);
      case "worker_lifecycle":
        return Boolean(this.deps.workerLifecycle?.createWorker);
      case "worker_assignment_engine":
        return Boolean(this.deps.workerAssignmentEngine?.discoverEligibleWorkers);
      case "enterprise_platform_factory_core":
        return Boolean(this.deps.enterprisePlatformFactoryCore?.getMissions);
      case "requirements_worker":
        return Boolean(this.deps.requirementsWorker?.getRequirementsReports);
      case "architecture_worker":
        return Boolean(this.deps.architectureWorker?.getArchitectureReports);
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
}
