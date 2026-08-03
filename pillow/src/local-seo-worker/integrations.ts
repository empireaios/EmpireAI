import type { ServiceOfferReport } from "../service-offer-worker/types.js";
import { LOCAL_SEO_WORKER_IDENTITY } from "./paths.js";
import { appendLseoLog } from "./lseo-logging.js";
import type { IntegrationHandshake, IntegrationTarget, LocalSeoReport } from "./types.js";

/** Optional live workforce integrations for Q7-07 Local SEO Worker. */
export type LocalSeoWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
  serviceOfferWorker?: {
    getReports?: () => ServiceOfferReport[];
    getLatestReportId?: () => string | null;
    getQ704ConsumableContract?: () => unknown;
  } | null;
  crmWorker?: {
    getContacts?: () => Array<{ name?: string; phone?: string; address?: string }>;
    getLatestCustomerId?: () => string | null;
  } | null;
  whatsAppWorker?: {
    getConversations?: () => Array<{ conversationId?: string; labels?: string[] }>;
    getLatestConversationId?: () => string | null;
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
  private deps: LocalSeoWorkerDependencies = {};

  bind(deps: LocalSeoWorkerDependencies = {}) {
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
      appendLseoLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveOfferById(offerReportId: string): ServiceOfferReport | null {
    try {
      const reports = this.deps.serviceOfferWorker?.getReports?.() ?? [];
      return reports.find((r) => r.reportId === offerReportId) ?? null;
    } catch {
      return null;
    }
  }

  submitReport(report: LocalSeoReport): {
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
      missionId: "Q7-07",
      currentStatus: "local_seo_assets_prepared",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.outstandingIssues,
      risks: ["never_claim_live_rankings", "never_publish_websites"],
      evidence: [
        `sourceOffer=${report.sourceOfferReportId}`,
        `pages=${report.landingPagesGenerated.length}`,
        `keywords=${report.localKeywords.length}`,
        `completeness=${report.seoCompletenessStatus.score}`,
      ],
      nextAction: "await_q7_08_consumer",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      localSeoReport: report,
      neverPublishWebsites: true,
      neverPurchaseBacklinks: true,
      neverManipulateSearchRankings: true,
      neverModifyLiveGoogleBusinessProfilesAutomatically: true,
      neverFabricateSeoPerformanceResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lseo-${Date.now()}`;
    appendLseoLog({
      event: "submit_report",
      details: `report=${report.reportId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "local_seo_report",
        reportId: report.reportId,
        businessProjectId: report.businessProjectId,
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
      workerName: LOCAL_SEO_WORKER_IDENTITY.workerName,
      workerType: LOCAL_SEO_WORKER_IDENTITY.workerType,
      department: LOCAL_SEO_WORKER_IDENTITY.department,
      factory: LOCAL_SEO_WORKER_IDENTITY.factory,
      role: LOCAL_SEO_WORKER_IDENTITY.role,
      reportingLine: [...LOCAL_SEO_WORKER_IDENTITY.reportingLine],
      skillProfile: [...LOCAL_SEO_WORKER_IDENTITY.skillProfile],
      approvedTools: [...LOCAL_SEO_WORKER_IDENTITY.approvedTools],
      authorityLevel: LOCAL_SEO_WORKER_IDENTITY.authorityLevel,
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
      case "service_offer_worker":
        return !!this.deps.serviceOfferWorker;
      case "crm_worker":
        return !!this.deps.crmWorker;
      case "whatsapp_worker":
        return !!this.deps.whatsAppWorker;
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
    return `${target} integration ${status} for ${workerId}; local-seo-asset-preparation-only worker under Pillow.`;
  }
}
