import { SERVICE_OFFER_WORKER_IDENTITY } from "./paths.js";
import { appendSowLog } from "./sow-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  LocalMarketResearchReport,
  ServiceOfferReport,
} from "./types.js";

/** Optional live workforce integrations for Q7-03 Service Offer Worker. */
export type ServiceOfferWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  localMarketResearchWorker?: {
    getReports?: () => LocalMarketResearchReport[];
    getLatestResearchId?: () => string | null;
    getQ703ConsumableContract?: () => unknown;
  } | null;
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
  memoryRuntime?: {
    remember?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ServiceOfferWorkerDependencies = {};

  bind(deps: ServiceOfferWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
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
      appendSowLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveMarketResearchById(researchId: string): LocalMarketResearchReport | null {
    try {
      const reports = this.deps.localMarketResearchWorker?.getReports?.() ?? [];
      return reports.find((r) => r.researchId === researchId) ?? null;
    } catch {
      return null;
    }
  }

  submitReport(report: ServiceOfferReport): {
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
      businessId: report.businessProjectId,
      missionId: "Q7-03",
      currentStatus: "service_offer_complete",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingQuestions,
      risks: report.risks,
      evidence: [
        `sourceResearch=${report.sourceResearchId}`,
        `packages=${report.servicePackages.length}`,
        `catalogue=${report.serviceCatalogue.length}`,
      ],
      nextAction: "await_q7_04_booking_worker",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      serviceOfferReport: report,
      neverBuildBookingSystems: true,
      neverBuildCrm: true,
      neverLaunchBusiness: true,
      neverFabricatePricingEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-sow-${Date.now()}`;
    appendSowLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "service_offer_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        sourceResearchId: report.sourceResearchId,
      });
    } catch {
      /* memory soft-optional */
    }
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: SERVICE_OFFER_WORKER_IDENTITY.workerName,
      workerType: SERVICE_OFFER_WORKER_IDENTITY.workerType,
      department: SERVICE_OFFER_WORKER_IDENTITY.department,
      factory: SERVICE_OFFER_WORKER_IDENTITY.factory,
      role: SERVICE_OFFER_WORKER_IDENTITY.role,
      reportingLine: [...SERVICE_OFFER_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SERVICE_OFFER_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SERVICE_OFFER_WORKER_IDENTITY.approvedTools],
      authorityLevel: SERVICE_OFFER_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q7-03",
        requiredSkills: [...SERVICE_OFFER_WORKER_IDENTITY.skillProfile],
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
      case "local_business_factory_core":
        return !!this.deps.localBusinessFactoryCore;
      case "local_market_research_worker":
        return !!this.deps.localMarketResearchWorker;
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
    return `${target} integration ${status} for ${workerId}; service-offer-only worker under Pillow.`;
  }
}
