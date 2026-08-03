import { REQUIREMENTS_WORKER_IDENTITY } from "./paths.js";
import { appendRqwLog } from "./rqw-logging.js";
import type {
  RequirementsReport,
  RequirementsWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";

/** Optional live workforce integrations for Q6-02 Requirements Worker. */
export type RequirementsWorkerDependencies = {
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

export type EnrichmentContext = {
  platformId?: string | null;
  platformName?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  businessObjective?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: RequirementsWorkerDependencies = {};

  bind(deps: RequirementsWorkerDependencies = {}) {
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
      appendRqwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromEnterprisePlatformFactoryCore(
    input: RequirementsWorkerInput,
  ): RequirementsWorkerInput {
    const missions = this.deps.enterprisePlatformFactoryCore?.getMissions?.() ?? [];
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.platformId && m.platformId === input.platformId) ||
          (input.businessId && m.businessId === input.businessId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);

    return {
      ...input,
      platformId:
        input.platformId ??
        missionMatch?.platformId ??
        null,
      platformName:
        input.platformName ??
        missionMatch?.platformName ??
        null,
      businessId:
        input.businessId ??
        missionMatch?.businessId ??
        null,
      factoryMissionId:
        input.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.enterprisePlatformFactoryCore?.getLatestMissionId?.() ??
        null,
      businessObjective:
        input.businessObjective ??
        missionMatch?.businessObjective ??
        null,
    };
  }

  pullPlatformContext(input: RequirementsWorkerInput): {
    enrichment: EnrichmentContext | null;
  } {
    const enriched = this.enrichFromEnterprisePlatformFactoryCore(input);
    const enrichment: EnrichmentContext | null =
      enriched.platformId ||
      enriched.platformName ||
      enriched.businessId ||
      enriched.factoryMissionId ||
      enriched.businessObjective
        ? {
            platformId: enriched.platformId ?? null,
            platformName: enriched.platformName ?? null,
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            businessObjective: enriched.businessObjective ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(reports: RequirementsReport[]): {
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
    const primary = reports[reports.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_requirements_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q6-02",
      currentStatus: "requirements_worker_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: reports
        .filter((r) => !r.selfReviewPassed)
        .map((r) => `self_review_blocker:${r.requirementsId}`),
      risks: reports
        .filter((r) => r.researchCompliance === "non_compliant")
        .map((r) => `research_compliance_risk:${r.requirementsId}`),
      evidence: [
        `platform:${primary.platformName}`,
        `objective:${primary.businessObjective.slice(0, 80)}`,
        `functional:${primary.functionalRequirements.length}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction: "await_pillow_review_of_requirements_no_architecture_or_code",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      requirementsReportCount: reports.length,
      confidenceScore: primary.confidenceScore,
      neverDesignedArchitecture: true,
      neverWroteApplicationCode: true,
      neverDeployedSoftware: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-rqw-${Date.now()}`;
    appendRqwLog({
      event: "submit_report",
      details: `reports=${reports.length} executive=${executiveReportId}`,
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
      workerName: REQUIREMENTS_WORKER_IDENTITY.workerName,
      workerType: REQUIREMENTS_WORKER_IDENTITY.workerType,
      department: REQUIREMENTS_WORKER_IDENTITY.department,
      factory: REQUIREMENTS_WORKER_IDENTITY.factory,
      role: REQUIREMENTS_WORKER_IDENTITY.role,
      reportingLine: [...REQUIREMENTS_WORKER_IDENTITY.reportingLine],
      skillProfile: [...REQUIREMENTS_WORKER_IDENTITY.skillProfile],
      approvedTools: [...REQUIREMENTS_WORKER_IDENTITY.approvedTools],
      authorityLevel: REQUIREMENTS_WORKER_IDENTITY.authorityLevel,
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
      /* lifecycle optional */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q6-02",
        requiredSkills: [...REQUIREMENTS_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* assignment optional */
    }
    try {
      this.deps.workerPerformanceReview?.registerPerformanceWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* performance optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* recovery optional */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return Boolean(this.deps.workerRegistry?.registerWorker);
      case "worker_lifecycle":
        return Boolean(this.deps.workerLifecycle?.createWorker);
      case "worker_assignment_engine":
        return Boolean(this.deps.workerAssignmentEngine?.discoverEligibleWorkers);
      case "enterprise_platform_factory_core":
        return Boolean(this.deps.enterprisePlatformFactoryCore?.getMissions);
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

  private describe(target: IntegrationTarget, workerId: string, status: string) {
    return `Requirements Worker ${workerId} ↔ ${target} (${status})`;
  }
}
