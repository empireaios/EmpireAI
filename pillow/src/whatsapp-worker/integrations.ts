import { WHATSAPP_WORKER_IDENTITY } from "./paths.js";
import { appendWawLog } from "./waw-logging.js";
import type {
  CrmReport,
  IntegrationHandshake,
  IntegrationTarget,
  Q706ConsumableContract,
  WhatsAppReport,
} from "./types.js";

/** Optional live workforce integrations for Q7-06 WhatsApp Worker. */
export type WhatsAppWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  bookingWorker?: {
    createBooking?: (input: Record<string, unknown>) => unknown;
    generateConfirmation?: (input: Record<string, unknown>) => unknown;
    getReports?: () => unknown[];
    getLatestReportId?: () => string | null;
  } | null;
  crmWorker?: {
    captureLead?: (input: Record<string, unknown>) => unknown;
    recordContact?: (input: Record<string, unknown>) => unknown;
    scheduleFollowUp?: (input: Record<string, unknown>) => unknown;
    getReports?: () => CrmReport[];
    getLatestReportId?: () => string | null;
    getQ706ConsumableContract?: () => Q706ConsumableContract | unknown;
  } | null;
  notificationWorker?: {
    enqueue?: (input: Record<string, unknown>) => unknown;
    enqueueNotification?: (input: Record<string, unknown>) => unknown;
    getLatestReportId?: () => string | null;
  } | object | null;
  apiIntegrationWorker?: {
    invoke?: (input: Record<string, unknown>) => unknown;
    getLatestReportId?: () => string | null;
  } | object | null;
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
  private deps: WhatsAppWorkerDependencies = {};

  bind(deps: WhatsAppWorkerDependencies = {}) {
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
      appendWawLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  getQ706ConsumableContract(): Q706ConsumableContract | null {
    try {
      const contract = this.deps.crmWorker?.getQ706ConsumableContract?.();
      return (contract as Q706ConsumableContract) ?? null;
    } catch {
      return null;
    }
  }

  triggerCrm(params: {
    action: "captureLead" | "recordContact" | "scheduleFollowUp";
    input: Record<string, unknown>;
  }): { ok: boolean; details: string; result: unknown } {
    const crm = this.deps.crmWorker;
    if (!crm) {
      return { ok: false, details: "crm_worker_unavailable", result: null };
    }
    try {
      let result: unknown;
      if (params.action === "captureLead") {
        if (!crm.captureLead) return { ok: false, details: "crm_captureLead_unavailable", result: null };
        result = crm.captureLead(params.input);
      } else if (params.action === "recordContact") {
        if (!crm.recordContact) return { ok: false, details: "crm_recordContact_unavailable", result: null };
        result = crm.recordContact(params.input);
      } else {
        if (!crm.scheduleFollowUp) {
          return { ok: false, details: "crm_scheduleFollowUp_unavailable", result: null };
        }
        result = crm.scheduleFollowUp(params.input);
      }
      appendWawLog({
        event: "trigger_crm_workflow",
        details: `action=${params.action} ok=true`,
      });
      return { ok: true, details: `crm_${params.action}_triggered`, result };
    } catch (err) {
      return {
        ok: false,
        details: `crm_${params.action}_failed:${err instanceof Error ? err.message : "error"}`,
        result: null,
      };
    }
  }

  triggerBooking(params: {
    action: "createBooking" | "generateConfirmation";
    input: Record<string, unknown>;
  }): { ok: boolean; details: string; result: unknown } {
    const booking = this.deps.bookingWorker;
    if (!booking) {
      return { ok: false, details: "booking_worker_unavailable", result: null };
    }
    try {
      let result: unknown;
      if (params.action === "createBooking") {
        if (!booking.createBooking) {
          return { ok: false, details: "booking_createBooking_unavailable", result: null };
        }
        result = booking.createBooking(params.input);
      } else {
        if (!booking.generateConfirmation) {
          return { ok: false, details: "booking_generateConfirmation_unavailable", result: null };
        }
        result = booking.generateConfirmation(params.input);
      }
      appendWawLog({
        event: "trigger_booking_workflow",
        details: `action=${params.action} ok=true`,
      });
      return { ok: true, details: `booking_${params.action}_triggered`, result };
    } catch (err) {
      return {
        ok: false,
        details: `booking_${params.action}_failed:${err instanceof Error ? err.message : "error"}`,
        result: null,
      };
    }
  }

  submitReport(report: WhatsAppReport): {
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
      missionId: "Q7-06",
      currentStatus: "whatsapp_complete",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: report.outstandingIssues,
      evidence: [
        `conversation=${report.conversationId}`,
        `status=${report.conversationStatus}`,
        `messages=${report.messages.length}`,
        `evidenceMode=${report.evidenceMode}`,
      ],
      nextAction: "await_q7_07_downstream",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      whatsappReport: report,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverFabricateMessageDeliveryResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-waw-${Date.now()}`;
    appendWawLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "whatsapp_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        conversationId: report.conversationId,
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
      workerName: WHATSAPP_WORKER_IDENTITY.workerName,
      workerType: WHATSAPP_WORKER_IDENTITY.workerType,
      department: WHATSAPP_WORKER_IDENTITY.department,
      factory: WHATSAPP_WORKER_IDENTITY.factory,
      role: WHATSAPP_WORKER_IDENTITY.role,
      reportingLine: [...WHATSAPP_WORKER_IDENTITY.reportingLine],
      skillProfile: [...WHATSAPP_WORKER_IDENTITY.skillProfile],
      approvedTools: [...WHATSAPP_WORKER_IDENTITY.approvedTools],
      authorityLevel: WHATSAPP_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q7-06",
        requiredSkills: [...WHATSAPP_WORKER_IDENTITY.skillProfile],
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
      case "booking_worker":
        return !!this.deps.bookingWorker;
      case "crm_worker":
        return !!this.deps.crmWorker;
      case "notification_worker":
        return !!this.deps.notificationWorker;
      case "api_integration_worker":
        return !!this.deps.apiIntegrationWorker;
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
    return `${target} integration ${status} for ${workerId}; WhatsApp-only worker under Pillow.`;
  }
}
