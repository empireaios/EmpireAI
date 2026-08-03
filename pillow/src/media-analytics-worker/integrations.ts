import { MEDIA_ANALYTICS_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  MediaAnalyticsReport,
  MediaAnalyticsWorkerInput,
} from "./types.js";
import { appendMawLog } from "./maw-logging.js";

/** Optional live workforce integrations for Q4-15 Media Analytics Worker. */
export type MediaAnalyticsWorkerDependencies = {
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
  publishingWorker?: {
    getLatestPublishingReportId?: () => string | null;
    getPublishingReports?: () => Array<{
      publishingReportId?: string | null;
      mediaId?: string | null;
      channelId?: string | null;
      targetPlatform?: string | null;
      videoTitle?: string | null;
      assemblyId?: string | null;
    }>;
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

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: MediaAnalyticsWorkerDependencies = {};

  bind(deps: MediaAnalyticsWorkerDependencies = {}) {
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
      appendMawLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromPublishingWorker(input: MediaAnalyticsWorkerInput): MediaAnalyticsWorkerInput {
    const reports = this.deps.publishingWorker?.getPublishingReports?.() ?? [];
    const publishingReportId =
      input.publishingReportId ??
      this.deps.publishingWorker?.getLatestPublishingReportId?.() ??
      null;
    const match =
      (publishingReportId
        ? reports.find((r) => r.publishingReportId === publishingReportId)
        : null) ??
      (input.mediaId ? reports.find((r) => r.mediaId === input.mediaId) : null) ??
      (input.channelId ? reports.find((r) => r.channelId === input.channelId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    return {
      ...input,
      publishingReportId:
        input.publishingReportId ?? match?.publishingReportId ?? publishingReportId ?? null,
      mediaId: input.mediaId ?? match?.mediaId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      platform: input.platform ?? match?.targetPlatform ?? null,
    };
  }

  enrichInput(input: MediaAnalyticsWorkerInput): MediaAnalyticsWorkerInput {
    return this.enrichFromPublishingWorker(input);
  }

  submitReport(reports: MediaAnalyticsReport[]): {
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
        details: "no_analytics_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId,
      missionId: "Q4-15",
      currentStatus: "media_analytics_ready",
      progress: Math.min(100, Math.max(40, primary.confidenceScore)),
      blockers: [],
      risks: primary.performancePatterns
        .filter((p) => p.classification === "weak" && p.severity === "critical")
        .map((p) => `weak_pattern:${p.patternId}:${p.dimension}`),
      evidence: [
        `media:${primary.mediaId}`,
        `platform:${primary.platform}`,
        `views:${primary.views.value}`,
        `ctr:${primary.clickThroughRate.value}`,
        `retention:${primary.retentionMetrics.averageViewPercentage}`,
        `confidence:${primary.confidenceScore}`,
        primary.publishingReportId ? `publishing:${primary.publishingReportId}` : null,
      ].filter(Boolean),
      nextAction: "await_learning_workers_no_content_mutation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      analyticsReportCount: reports.length,
      neverAlteredSourceAnalytics: true,
      neverRewroteContent: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-maw-${Date.now()}`;
    appendMawLog({
      event: "submit_report",
      details: `analyticsReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: MEDIA_ANALYTICS_WORKER_IDENTITY.workerName,
      workerType: MEDIA_ANALYTICS_WORKER_IDENTITY.workerType,
      department: MEDIA_ANALYTICS_WORKER_IDENTITY.department,
      factory: MEDIA_ANALYTICS_WORKER_IDENTITY.factory,
      role: MEDIA_ANALYTICS_WORKER_IDENTITY.role,
      reportingLine: [...MEDIA_ANALYTICS_WORKER_IDENTITY.reportingLine],
      skillProfile: [...MEDIA_ANALYTICS_WORKER_IDENTITY.skillProfile],
      approvedTools: [...MEDIA_ANALYTICS_WORKER_IDENTITY.approvedTools],
      authorityLevel: MEDIA_ANALYTICS_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-15",
        requiredSkills: [...MEDIA_ANALYTICS_WORKER_IDENTITY.skillProfile],
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
      case "publishing_worker":
        return Boolean(this.deps.publishingWorker?.getPublishingReports);
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
    return `Media Analytics Worker ${workerId} ↔ ${target} (${status})`;
  }
}
