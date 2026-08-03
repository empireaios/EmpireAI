import { BOOKING_WORKER_IDENTITY } from "./paths.js";
import { appendBkwLog } from "./bkw-logging.js";
import type {
  BookingReport,
  IntegrationHandshake,
  IntegrationTarget,
  ServiceOfferReport,
} from "./types.js";

/** Optional live workforce integrations for Q7-04 Booking Worker. */
export type BookingWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  localMarketResearchWorker?: {
    getReports?: () => unknown[];
    getLatestResearchId?: () => string | null;
  } | null;
  serviceOfferWorker?: {
    getReports?: () => ServiceOfferReport[];
    getLatestReportId?: () => string | null;
    getQ704ConsumableContract?: () => unknown;
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
  private deps: BookingWorkerDependencies = {};

  bind(deps: BookingWorkerDependencies = {}) {
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
      appendBkwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveServiceOfferById(reportId: string): ServiceOfferReport | null {
    try {
      const reports = this.deps.serviceOfferWorker?.getReports?.() ?? [];
      return reports.find((r) => r.reportId === reportId) ?? null;
    } catch {
      return null;
    }
  }

  submitReport(report: BookingReport): {
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
      missionId: "Q7-04",
      currentStatus: "booking_complete",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `sourceOffer=${report.sourceOfferReportId}`,
        `booking=${report.bookingId}`,
        `status=${report.bookingStatus}`,
      ],
      nextAction: "await_q7_05_downstream",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      bookingReport: report,
      neverPerformTheService: true,
      neverProcessPayments: true,
      neverReplaceCrm: true,
      neverFabricateBookingConfirmations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-bkw-${Date.now()}`;
    appendBkwLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "booking_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        bookingId: report.bookingId,
        sourceOfferReportId: report.sourceOfferReportId,
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
      workerName: BOOKING_WORKER_IDENTITY.workerName,
      workerType: BOOKING_WORKER_IDENTITY.workerType,
      department: BOOKING_WORKER_IDENTITY.department,
      factory: BOOKING_WORKER_IDENTITY.factory,
      role: BOOKING_WORKER_IDENTITY.role,
      reportingLine: [...BOOKING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...BOOKING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...BOOKING_WORKER_IDENTITY.approvedTools],
      authorityLevel: BOOKING_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q7-04",
        requiredSkills: [...BOOKING_WORKER_IDENTITY.skillProfile],
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
      case "service_offer_worker":
        return !!this.deps.serviceOfferWorker;
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
    return `${target} integration ${status} for ${workerId}; booking-only worker under Pillow.`;
  }
}
