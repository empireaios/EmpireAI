import type { LocalSeoReport } from "../local-seo-worker/types.js";
import { LEAD_GENERATION_WORKER_IDENTITY } from "./paths.js";
import { appendLgwLog } from "./lgw-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  LeadGenerationReport,
} from "./types.js";

/** Optional live workforce integrations for Q7-08 Lead Generation Worker. */
export type LeadGenerationWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  crmWorker?: {
    captureLead?: (input: Record<string, unknown>) => unknown;
    updateLeadStatus?: (input: Record<string, unknown>) => unknown;
    recordContact?: (input: Record<string, unknown>) => unknown;
    getLatestLeadId?: () => string | null;
    getLeads?: () => unknown[];
  } | null;
  whatsAppWorker?: {
    receiveInboundEnquiry?: (input: Record<string, unknown>) => unknown;
    getConversations?: () => Array<{ conversationId?: string; labels?: string[] }>;
    getLatestConversationId?: () => string | null;
  } | null;
  localSeoWorker?: {
    getReports?: () => LocalSeoReport[];
    getLatestReportId?: () => string | null;
    getQ708ConsumableContract?: () => unknown;
  } | null;
  bookingWorker?: {
    createBooking?: (input: Record<string, unknown>) => unknown;
    getLatestBookingId?: () => string | null;
    getBookings?: () => unknown[];
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
  private deps: LeadGenerationWorkerDependencies = {};

  bind(deps: LeadGenerationWorkerDependencies = {}) {
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
      appendLgwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveSeoById(seoReportId: string): LocalSeoReport | null {
    try {
      const reports = this.deps.localSeoWorker?.getReports?.() ?? [];
      return reports.find((r) => r.reportId === seoReportId) ?? null;
    } catch {
      return null;
    }
  }

  routeToCrm(input: Record<string, unknown>): {
    ok: boolean;
    details: string;
    result: unknown;
    crmLeadRef: string | null;
  } {
    const crm = this.deps.crmWorker;
    if (!crm?.captureLead) {
      return {
        ok: false,
        details: "crm_captureLead_unavailable",
        result: null,
        crmLeadRef: null,
      };
    }
    try {
      const result = crm.captureLead(input);
      try {
        crm.recordContact?.(input);
      } catch {
        /* optional */
      }
      try {
        crm.updateLeadStatus?.({
          ...input,
          leadStatus: input.leadStatus ?? "new",
        });
      } catch {
        /* optional */
      }
      const crmLeadRef =
        (result as { latestLead?: { leadId?: string } } | null)?.latestLead
          ?.leadId ??
        crm.getLatestLeadId?.() ??
        `crm-ref-${Date.now()}`;
      appendLgwLog({
        event: "route_lead_to_crm",
        details: `crmLeadRef=${crmLeadRef}`,
      });
      return { ok: true, details: "routed_to_crm", result, crmLeadRef };
    } catch (err) {
      return {
        ok: false,
        details: `crm_route_failed:${err instanceof Error ? err.message : "unknown"}`,
        result: null,
        crmLeadRef: null,
      };
    }
  }

  routeToBooking(input: Record<string, unknown>): {
    ok: boolean;
    details: string;
    result: unknown;
    bookingRef: string | null;
  } {
    const booking = this.deps.bookingWorker;
    if (!booking?.createBooking) {
      return {
        ok: false,
        details: "booking_createBooking_unavailable",
        result: null,
        bookingRef: null,
      };
    }
    try {
      const result = booking.createBooking(input);
      const bookingRef =
        (result as { latestBooking?: { bookingId?: string } } | null)
          ?.latestBooking?.bookingId ??
        booking.getLatestBookingId?.() ??
        `bkw-ref-${Date.now()}`;
      appendLgwLog({
        event: "route_lead_to_booking",
        details: `bookingRef=${bookingRef}`,
      });
      return { ok: true, details: "routed_to_booking", result, bookingRef };
    } catch (err) {
      return {
        ok: false,
        details: `booking_route_failed:${err instanceof Error ? err.message : "unknown"}`,
        result: null,
        bookingRef: null,
      };
    }
  }

  notifyWhatsAppInbound(input: Record<string, unknown>): {
    ok: boolean;
    details: string;
  } {
    const wa = this.deps.whatsAppWorker;
    if (!wa?.receiveInboundEnquiry) {
      return { ok: false, details: "whatsapp_receiveInboundEnquiry_unavailable" };
    }
    try {
      wa.receiveInboundEnquiry(input);
      return { ok: true, details: "whatsapp_inbound_notified" };
    } catch (err) {
      return {
        ok: false,
        details: `whatsapp_notify_failed:${err instanceof Error ? err.message : "unknown"}`,
      };
    }
  }

  submitReport(report: LeadGenerationReport): {
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
      missionId: "Q7-08",
      currentStatus: "lead_generation_assets_prepared",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: [
        "never_execute_advertising",
        "never_replace_crm",
        "never_fabricate_conversions",
      ],
      evidence: [
        `funnel=${report.funnelId}`,
        `leads=${report.capturedLeads.length}`,
        `sourceSeo=${report.sourceSeoReportId}`,
        `metricsObserved=${report.funnelPerformanceSummary.totalCapturedLeads}`,
      ],
      nextAction: "await_q7_09_consumer",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      leadGenerationReport: report,
      neverExecuteAdvertisingCampaigns: true,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverFabricateLeadOrConversionResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lgw-${Date.now()}`;
    appendLgwLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "lead_generation_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        funnelId: report.funnelId,
        sourceSeoReportId: report.sourceSeoReportId,
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
      workerName: LEAD_GENERATION_WORKER_IDENTITY.workerName,
      workerType: LEAD_GENERATION_WORKER_IDENTITY.workerType,
      department: LEAD_GENERATION_WORKER_IDENTITY.department,
      factory: LEAD_GENERATION_WORKER_IDENTITY.factory,
      role: LEAD_GENERATION_WORKER_IDENTITY.role,
      reportingLine: [...LEAD_GENERATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...LEAD_GENERATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...LEAD_GENERATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: LEAD_GENERATION_WORKER_IDENTITY.authorityLevel,
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
      case "crm_worker":
        return !!this.deps.crmWorker;
      case "whatsapp_worker":
        return !!this.deps.whatsAppWorker;
      case "local_seo_worker":
        return !!this.deps.localSeoWorker;
      case "booking_worker":
        return !!this.deps.bookingWorker;
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
    return `${target} integration ${status} for ${workerId}; lead-funnel-structural-signals-only worker under Pillow.`;
  }
}
