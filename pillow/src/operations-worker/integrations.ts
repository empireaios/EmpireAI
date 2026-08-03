import type { BookingReport } from "../booking-worker/types.js";
import type { LeadGenerationReport, Q709ConsumableContract } from "../lead-generation-worker/types.js";
import { OPERATIONS_WORKER_IDENTITY } from "./paths.js";
import { appendOpsLog } from "./ops-logging.js";
import type { IntegrationHandshake, IntegrationTarget, OperationsReport } from "./types.js";

/** Optional live workforce integrations for Q7-09 Operations Worker. */
export type OperationsWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  bookingWorker?: {
    getBookings?: () => Array<Record<string, unknown>>;
    getReports?: () => BookingReport[];
    getLatestBookingId?: () => string | null;
  } | null;
  crmWorker?: {
    recordContact?: (input: Record<string, unknown>) => unknown;
    getLatestLeadId?: () => string | null;
  } | null;
  whatsAppWorker?: {
    notifyOperationalUpdate?: (input: Record<string, unknown>) => unknown;
    receiveInboundEnquiry?: (input: Record<string, unknown>) => unknown;
  } | null;
  leadGenerationWorker?: {
    getReports?: () => LeadGenerationReport[];
    getQ709ConsumableContract?: () => Q709ConsumableContract;
  } | null;
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
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
  private deps: OperationsWorkerDependencies = {};

  bind(deps: OperationsWorkerDependencies = {}) {
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
      appendOpsLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  findBookingById(bookingId: string): Record<string, unknown> | null {
    try {
      const bookings = this.deps.bookingWorker?.getBookings?.() ?? [];
      const found = bookings.find((b) => b.bookingId === bookingId);
      if (found) return found;
      const reports = this.deps.bookingWorker?.getReports?.() ?? [];
      const foundReport = reports.find((r) => r.bookingId === bookingId);
      return foundReport ? (foundReport as unknown as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  resolveLatestLeadGenerationReport(businessProjectId: string): LeadGenerationReport | null {
    try {
      const reports = this.deps.leadGenerationWorker?.getReports?.() ?? [];
      const matches = reports.filter((r) => r.businessProjectId === businessProjectId);
      return matches.length ? matches[matches.length - 1]! : null;
    } catch {
      return null;
    }
  }

  notifyOperationalUpdate(input: Record<string, unknown>): { ok: boolean; details: string } {
    const wa = this.deps.whatsAppWorker;
    if (!wa?.notifyOperationalUpdate) {
      return { ok: false, details: "whatsapp_notifyOperationalUpdate_unavailable" };
    }
    try {
      wa.notifyOperationalUpdate(input);
      return { ok: true, details: "operational_update_notified" };
    } catch (err) {
      return {
        ok: false,
        details: `whatsapp_notify_failed:${err instanceof Error ? err.message : "unknown"}`,
      };
    }
  }

  submitReport(report: OperationsReport): {
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
      missionId: "Q7-09",
      currentStatus: "operations_workflow_designed",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: [
        "never_perform_customer_services",
        "never_replace_booking_or_crm_or_lead_generation",
        "never_fabricate_operational_evidence",
      ],
      evidence: [
        `workflow=${report.workflowId}`,
        `stages=${report.operationalStages.length}`,
        `sourceBooking=${report.sourceBookingId}`,
      ],
      nextAction: "await_q7_10_consumer",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      operationsReport: report,
      neverFabricateOperationalEvidence: true,
      neverPerformCustomerServices: true,
      neverReplaceBookingWorker: true,
      neverReplaceCrmWorker: true,
      neverReplaceLeadGenerationWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-opsw-${Date.now()}`;
    appendOpsLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "operations_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        workflowId: report.workflowId,
        sourceBookingId: report.sourceBookingId,
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
      workerName: OPERATIONS_WORKER_IDENTITY.workerName,
      workerType: OPERATIONS_WORKER_IDENTITY.workerType,
      department: OPERATIONS_WORKER_IDENTITY.department,
      factory: OPERATIONS_WORKER_IDENTITY.factory,
      role: OPERATIONS_WORKER_IDENTITY.role,
      reportingLine: [...OPERATIONS_WORKER_IDENTITY.reportingLine],
      skillProfile: [...OPERATIONS_WORKER_IDENTITY.skillProfile],
      approvedTools: [...OPERATIONS_WORKER_IDENTITY.approvedTools],
      authorityLevel: OPERATIONS_WORKER_IDENTITY.authorityLevel,
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
      case "booking_worker":
        return !!this.deps.bookingWorker;
      case "crm_worker":
        return !!this.deps.crmWorker;
      case "whatsapp_worker":
        return !!this.deps.whatsAppWorker;
      case "lead_generation_worker":
        return !!this.deps.leadGenerationWorker;
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
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
    return `${target} integration ${status} for ${workerId}; operations-workflow-design-structural-signals-only worker under Pillow.`;
  }
}
