import type { BookingReport } from "../booking-worker/types.js";
import type { CrmReport } from "../crm-worker/types.js";
import type { LeadGenerationReport, Q709ConsumableContract } from "../lead-generation-worker/types.js";
import type { LocalMarketResearchReport } from "../local-market-research-worker/types.js";
import type { LocalSeoReport } from "../local-seo-worker/types.js";
import type { LocalBusinessProject } from "../local-business-factory-core/types.js";
import type { OperationsReport, Q710ConsumableContract } from "../operations-worker/types.js";
import type { ServiceOfferReport } from "../service-offer-worker/types.js";
import type { WhatsAppReport } from "../whatsapp-worker/types.js";
import { LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY } from "./paths.js";
import { appendLblpLog } from "./lblp-logging.js";
import type { IntegrationHandshake, IntegrationTarget, LocalBusinessLaunchReport } from "./types.js";

/** Optional live workforce integrations for Q7-10 Local Business Launch Pack. */
export type LocalBusinessLaunchPackDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => LocalBusinessProject[];
    getLatestProjectId?: () => string | null;
  } | null;
  localMarketResearchWorker?: {
    getReports?: () => LocalMarketResearchReport[];
  } | null;
  serviceOfferWorker?: {
    getReports?: () => ServiceOfferReport[];
  } | null;
  bookingWorker?: {
    getReports?: () => BookingReport[];
    getBookings?: () => Array<Record<string, unknown>>;
  } | null;
  crmWorker?: {
    getReports?: () => CrmReport[];
  } | null;
  whatsAppWorker?: {
    getReports?: () => WhatsAppReport[];
  } | null;
  localSeoWorker?: {
    getReports?: () => LocalSeoReport[];
  } | null;
  leadGenerationWorker?: {
    getReports?: () => LeadGenerationReport[];
    getQ709ConsumableContract?: () => Q709ConsumableContract;
  } | null;
  operationsWorker?: {
    getReports?: () => OperationsReport[];
    getQ710ConsumableContract?: () => Q710ConsumableContract;
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
  private deps: LocalBusinessLaunchPackDependencies = {};

  bind(deps: LocalBusinessLaunchPackDependencies = {}) {
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
      appendLblpLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  getLiveLbfcProjects(): Array<Record<string, unknown>> {
    try {
      return (this.deps.localBusinessFactoryCore?.getProjects?.() ?? []) as Array<
        Record<string, unknown>
      >;
    } catch {
      return [];
    }
  }

  getLiveMarketResearchReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.localMarketResearchWorker?.getReports?.() ?? []) as Array<
        Record<string, unknown>
      >;
    } catch {
      return [];
    }
  }

  getLiveServiceOfferReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.serviceOfferWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveBookingReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.bookingWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveCrmReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.crmWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveWhatsAppReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.whatsAppWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveLocalSeoReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.localSeoWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveLeadGenerationReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.leadGenerationWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  getLiveOperationsReports(): Array<Record<string, unknown>> {
    try {
      return (this.deps.operationsWorker?.getReports?.() ?? []) as Array<Record<string, unknown>>;
    } catch {
      return [];
    }
  }

  submitReport(report: LocalBusinessLaunchReport): {
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
      missionId: "Q7-10",
      currentStatus: "local_business_launch_pack_assembled",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: [
        "never_launch_business_automatically",
        "never_override_governance",
        "never_replace_certification",
        "never_claim_readiness_without_evidence",
      ],
      evidence: [
        `package=${report.packageId}`,
        `deliverablesVerified=${report.deliverableVerification.presentCount}/${report.deliverableVerification.requiredCount}`,
        `readiness=${report.readinessStatus}`,
      ],
      nextAction: "await_q7_11_consumer",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      localBusinessLaunchReport: report,
      neverLaunchBusinessAutomatically: true,
      neverOverrideGovernance: true,
      neverReplaceCertification: true,
      neverClaimReadinessWithoutEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lblp-${Date.now()}`;
    appendLblpLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "local_business_launch_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
        packageId: report.packageId,
        readinessStatus: report.readinessStatus,
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
      workerName: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.workerName,
      workerType: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.workerType,
      department: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.department,
      factory: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.factory,
      role: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.role,
      reportingLine: [...LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.reportingLine],
      skillProfile: [...LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.skillProfile],
      approvedTools: [...LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.approvedTools],
      authorityLevel: LOCAL_BUSINESS_LAUNCH_PACK_IDENTITY.authorityLevel,
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
      case "local_market_research_worker":
        return !!this.deps.localMarketResearchWorker;
      case "service_offer_worker":
        return !!this.deps.serviceOfferWorker;
      case "booking_worker":
        return !!this.deps.bookingWorker;
      case "crm_worker":
        return !!this.deps.crmWorker;
      case "whatsapp_worker":
        return !!this.deps.whatsAppWorker;
      case "local_seo_worker":
        return !!this.deps.localSeoWorker;
      case "lead_generation_worker":
        return !!this.deps.leadGenerationWorker;
      case "operations_worker":
        return !!this.deps.operationsWorker;
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
    return `${target} integration ${status} for ${workerId}; launch-pack-assembly-and-verification-only worker under Pillow.`;
  }
}
