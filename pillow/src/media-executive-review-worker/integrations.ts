import { MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY } from "./paths.js";
import type {
  AnalyticsSignal,
  IntegrationHandshake,
  IntegrationTarget,
  LearningSignal,
  MediaExecutiveReviewReport,
  MediaExecutiveReviewWorkerInput,
  PublishingSignal,
} from "./types.js";
import { appendMerLog } from "./mer-logging.js";

/** Optional live workforce integrations for Q4-18 Media Executive Review Worker. */
export type MediaExecutiveReviewWorkerDependencies = {
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
      publishingReportId?: string;
      mediaId?: string;
      channelId?: string;
      publishingReadinessStatus?: string;
      title?: string;
      tags?: unknown[];
      tagsCount?: number;
    }>;
  } | null;
  mediaAnalyticsWorker?: {
    getLatestAnalyticsReportId?: () => string | null;
    getAnalyticsReports?: () => Array<{
      analyticsReportId?: string;
      mediaId?: string;
      channelId?: string;
      confidenceScore?: number;
    }>;
  } | null;
  mediaLearningWorker?: {
    getLatestLearningReportId?: () => string | null;
    getLearningReports?: () => Array<{
      learningReportId?: string;
      channelId?: string;
      confidenceScore?: number;
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
  private deps: MediaExecutiveReviewWorkerDependencies = {};

  bind(deps: MediaExecutiveReviewWorkerDependencies = {}) {
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
      appendMerLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromPublishingWorker(
    input: MediaExecutiveReviewWorkerInput,
  ): MediaExecutiveReviewWorkerInput {
    const inputSignals = input.publishingSignals;
    // Empty-array trap: only enrich when input publishingSignals empty
    if (inputSignals && inputSignals.length > 0) {
      return input;
    }
    const reports = this.deps.publishingWorker?.getPublishingReports?.() ?? [];
    if (!reports.length) {
      const latestId = this.deps.publishingWorker?.getLatestPublishingReportId?.() ?? null;
      return {
        ...input,
        publishingReportId: input.publishingReportId ?? latestId,
      };
    }
    const publishingSignals: PublishingSignal[] = reports.map((r) => ({
      publishingReportId: r.publishingReportId,
      mediaId: r.mediaId,
      channelId: r.channelId,
      publishingReadinessStatus: r.publishingReadinessStatus,
      title: r.title,
      tagsCount: r.tagsCount ?? r.tags?.length ?? 0,
    }));
    return {
      ...input,
      publishingSignals: publishingSignals.length > 0 ? publishingSignals : null,
      publishingReportId:
        input.publishingReportId ??
        reports.find((r) => r.publishingReportId)?.publishingReportId ??
        null,
      mediaId: input.mediaId ?? reports.find((r) => r.mediaId)?.mediaId ?? null,
      channelId: input.channelId ?? reports.find((r) => r.channelId)?.channelId ?? null,
    };
  }

  enrichFromMediaAnalyticsWorker(
    input: MediaExecutiveReviewWorkerInput,
  ): MediaExecutiveReviewWorkerInput {
    const inputSignals = input.analyticsSignals;
    // Empty-array trap
    if (inputSignals && inputSignals.length > 0) {
      return input;
    }
    const reports = this.deps.mediaAnalyticsWorker?.getAnalyticsReports?.() ?? [];
    if (!reports.length) {
      const latestId = this.deps.mediaAnalyticsWorker?.getLatestAnalyticsReportId?.() ?? null;
      return {
        ...input,
        analyticsReportId: input.analyticsReportId ?? latestId,
      };
    }
    const analyticsSignals: AnalyticsSignal[] = reports.map((r) => ({
      analyticsReportId: r.analyticsReportId,
      mediaId: r.mediaId,
      channelId: r.channelId,
      confidenceScore: r.confidenceScore,
    }));
    return {
      ...input,
      analyticsSignals: analyticsSignals.length > 0 ? analyticsSignals : null,
      analyticsReportId:
        input.analyticsReportId ??
        reports.find((r) => r.analyticsReportId)?.analyticsReportId ??
        null,
      mediaId: input.mediaId ?? reports.find((r) => r.mediaId)?.mediaId ?? null,
      channelId: input.channelId ?? reports.find((r) => r.channelId)?.channelId ?? null,
    };
  }

  enrichFromMediaLearningWorker(
    input: MediaExecutiveReviewWorkerInput,
  ): MediaExecutiveReviewWorkerInput {
    const inputSignals = input.learningSignals;
    // Empty-array trap
    if (inputSignals && inputSignals.length > 0) {
      return input;
    }
    const reports = this.deps.mediaLearningWorker?.getLearningReports?.() ?? [];
    if (!reports.length) {
      const latestId = this.deps.mediaLearningWorker?.getLatestLearningReportId?.() ?? null;
      return {
        ...input,
        learningReportId: input.learningReportId ?? latestId,
      };
    }
    const learningSignals: LearningSignal[] = reports.map((r) => ({
      learningReportId: r.learningReportId,
      channelId: r.channelId,
      confidenceScore: r.confidenceScore,
    }));
    return {
      ...input,
      learningSignals: learningSignals.length > 0 ? learningSignals : null,
      learningReportId:
        input.learningReportId ??
        reports.find((r) => r.learningReportId)?.learningReportId ??
        null,
      channelId: input.channelId ?? reports.find((r) => r.channelId)?.channelId ?? null,
    };
  }

  enrichInput(input: MediaExecutiveReviewWorkerInput): MediaExecutiveReviewWorkerInput {
    let enriched = this.enrichFromPublishingWorker(input);
    enriched = this.enrichFromMediaAnalyticsWorker(enriched);
    enriched = this.enrichFromMediaLearningWorker(enriched);
    return enriched;
  }

  submitReport(reports: MediaExecutiveReviewReport[]): {
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
        details: "no_review_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId ?? primary.mediaId,
      missionId: "Q4-18",
      currentStatus: "media_executive_review_ready",
      progress: Math.min(
        100,
        Math.max(40, primary.assetCompleteness.completenessScore),
      ),
      blockers: primary.outstandingIssues
        .filter((i) => i.severity === "blocker")
        .map((i) => i.summary),
      risks: primary.outstandingIssues
        .filter((i) => i.severity === "warning")
        .map((i) => i.summary),
      evidence: [
        `media:${primary.mediaId}`,
        `channel:${primary.channelId}`,
        `recommendation:${primary.executiveRecommendation}`,
        `completeness:${primary.assetCompleteness.completenessScore}`,
        `quality:${primary.qualityAssessment.overallQualityScore}`,
        `compliance:${primary.complianceAssessment.complianceScore}`,
        `confidence:${primary.confidenceScore}`,
        `evidenceCount:${primary.supportingEvidence.length}`,
      ],
      nextAction: "await_pillow_grand_king_publish_decision_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      reviewReportCount: reports.length,
      neverPublishedMedia: true,
      neverPublishMedia: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-mer-${Date.now()}`;
    appendMerLog({
      event: "submit_report",
      details: `reviewReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.workerName,
      workerType: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.workerType,
      department: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.department,
      factory: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.factory,
      role: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.role,
      reportingLine: [...MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.reportingLine],
      skillProfile: [...MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.skillProfile],
      approvedTools: [...MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.approvedTools],
      authorityLevel: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-18",
        requiredSkills: [...MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.skillProfile],
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
      case "media_analytics_worker":
        return Boolean(this.deps.mediaAnalyticsWorker?.getAnalyticsReports);
      case "media_learning_worker":
        return Boolean(this.deps.mediaLearningWorker?.getLearningReports);
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
    return `Media Executive Review Worker ${workerId} ↔ ${target} (${status})`;
  }
}
