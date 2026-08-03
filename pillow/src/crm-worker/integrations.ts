import { CRM_WORKER_IDENTITY } from "./paths.js";
import { appendCrmwLog } from "./crmw-logging.js";
import type {
  BookingRecord,
  BookingReport,
  CrmReport,
  IntegrationHandshake,
  IntegrationTarget,
  Q705ConsumableContract,
} from "./types.js";

/** Optional live workforce integrations for Q7-05 CRM Worker. */
export type CrmWorkerDependencies = {
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
    getReports?: () => unknown[];
    getLatestReportId?: () => string | null;
  } | null;
  bookingWorker?: {
    getReports?: () => BookingReport[];
    getBookings?: () => BookingRecord[];
    getLatestReportId?: () => string | null;
    getQ705ConsumableContract?: () => Q705ConsumableContract | unknown;
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
  private deps: CrmWorkerDependencies = {};

  bind(deps: CrmWorkerDependencies = {}) {
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
      appendCrmwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveBookingById(bookingId: string): BookingReport | BookingRecord | null {
    try {
      const reports = this.deps.bookingWorker?.getReports?.() ?? [];
      const fromReport = reports.find((r) => r.bookingId === bookingId);
      if (fromReport) return fromReport;
      const bookings = this.deps.bookingWorker?.getBookings?.() ?? [];
      return bookings.find((b) => b.bookingId === bookingId) ?? null;
    } catch {
      return null;
    }
  }

  submitReport(report: CrmReport): {
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
      missionId: "Q7-05",
      currentStatus: "crm_complete",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingTasks,
      risks: report.outstandingTasks,
      evidence: [
        `customer=${report.customerId}`,
        `lifecycle=${report.customerLifecycleStage}`,
        `leadStatus=${report.leadStatus}`,
        `bookings=${report.bookingHistory.length}`,
      ],
      nextAction: "await_q7_06_downstream",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      crmReport: report,
      neverExecuteMarketingCampaigns: true,
      neverDeliverCustomerJobs: true,
      neverReplaceBookingFunctionality: true,
      neverFabricateCustomerInteractions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-crmw-${Date.now()}`;
    appendCrmwLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "crm_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        customerId: report.customerId,
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
      workerName: CRM_WORKER_IDENTITY.workerName,
      workerType: CRM_WORKER_IDENTITY.workerType,
      department: CRM_WORKER_IDENTITY.department,
      factory: CRM_WORKER_IDENTITY.factory,
      role: CRM_WORKER_IDENTITY.role,
      reportingLine: [...CRM_WORKER_IDENTITY.reportingLine],
      skillProfile: [...CRM_WORKER_IDENTITY.skillProfile],
      approvedTools: [...CRM_WORKER_IDENTITY.approvedTools],
      authorityLevel: CRM_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q7-05",
        requiredSkills: [...CRM_WORKER_IDENTITY.skillProfile],
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
      case "booking_worker":
        return !!this.deps.bookingWorker;
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
    return `${target} integration ${status} for ${workerId}; CRM-only worker under Pillow.`;
  }
}
