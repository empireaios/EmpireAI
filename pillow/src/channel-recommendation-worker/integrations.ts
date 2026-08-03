import { CHANNEL_RECOMMENDATION_WORKER_IDENTITY } from "./paths.js";
import type {
  AnalyticsSignal,
  ChannelRecommendationReport,
  ChannelRecommendationWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
  LearningSignal,
  TrendSignal,
} from "./types.js";
import { appendCrwLog } from "./crw-logging.js";

/** Optional live workforce integrations for Q4-17 Channel Recommendation Worker. */
export type ChannelRecommendationWorkerDependencies = {
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
  trendResearchWorker?: {
    getLatestTrendReportId?: () => string | null;
    getTrendReports?: () => Array<{
      trendReportId?: string;
      topics?: string[];
      demandSignals?: Array<{ topic?: string; demandScore?: number; competitionLevel?: string }>;
      competitionNotes?: string[];
      channelId?: string;
    }>;
  } | null;
  mediaAnalyticsWorker?: {
    getLatestAnalyticsReportId?: () => string | null;
    getAnalyticsReports?: () => Array<{
      analyticsReportId?: string;
      channelId?: string;
      views?: number | { value?: number };
      clickThroughRate?: number | { value?: number };
      retentionMetrics?: { averageViewPercentage?: number };
      revenueMetrics?: { estimatedRevenueUsd?: number | null; available?: boolean };
      confidenceScore?: number;
    }>;
  } | null;
  mediaLearningWorker?: {
    getLatestLearningReportId?: () => string | null;
    getLearningReports?: () => Array<{
      learningReportId?: string;
      channelId?: string;
      successfulPatterns?: unknown[];
      failedPatterns?: unknown[];
      confidenceScore?: number;
      topicInsights?: Array<{ summary?: string }>;
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
  private deps: ChannelRecommendationWorkerDependencies = {};

  bind(deps: ChannelRecommendationWorkerDependencies = {}) {
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
      appendCrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromTrendResearchWorker(
    input: ChannelRecommendationWorkerInput,
  ): ChannelRecommendationWorkerInput {
    const inputSignals = input.trendSignals;
    // Empty-array trap: only enrich when input trendSignals empty
    if (inputSignals && inputSignals.length > 0) {
      return input;
    }
    const reports = this.deps.trendResearchWorker?.getTrendReports?.() ?? [];
    if (!reports.length) {
      const latestId = this.deps.trendResearchWorker?.getLatestTrendReportId?.() ?? null;
      return {
        ...input,
        trendReportIds:
          input.trendReportIds && input.trendReportIds.length > 0
            ? input.trendReportIds
            : latestId
              ? [latestId]
              : input.trendReportIds ?? null,
      };
    }
    const trendSignals: TrendSignal[] = [];
    const trendReportIds = [...(input.trendReportIds ?? [])];
    for (const report of reports) {
      if (report.trendReportId) trendReportIds.push(report.trendReportId);
      const demand = report.demandSignals ?? [];
      // Empty-array trap
      if (demand.length > 0) {
        for (const signal of demand) {
          trendSignals.push({
            trendId: report.trendReportId,
            topic: signal.topic,
            demandScore: signal.demandScore,
            competitionLevel: signal.competitionLevel,
            summary: signal.topic
              ? `Trend demand for ${signal.topic}`
              : report.competitionNotes?.[0],
          });
        }
      } else if (report.topics && report.topics.length > 0) {
        for (const topic of report.topics) {
          trendSignals.push({
            trendId: report.trendReportId,
            topic,
            summary: `Topic ${topic} from trend research`,
          });
        }
      }
    }
    return {
      ...input,
      trendSignals: trendSignals.length > 0 ? trendSignals : null,
      trendReportIds: trendReportIds.length ? [...new Set(trendReportIds)] : null,
      channelIdHint:
        input.channelIdHint ??
        reports.find((r) => r.channelId)?.channelId ??
        null,
    };
  }

  enrichFromMediaAnalyticsWorker(
    input: ChannelRecommendationWorkerInput,
  ): ChannelRecommendationWorkerInput {
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
        analyticsReportIds:
          input.analyticsReportIds && input.analyticsReportIds.length > 0
            ? input.analyticsReportIds
            : latestId
              ? [latestId]
              : input.analyticsReportIds ?? null,
      };
    }
    const analyticsSignals: AnalyticsSignal[] = reports.map((r) => ({
      analyticsReportId: r.analyticsReportId,
      channelId: r.channelId,
      views: metricValue(r.views) ?? undefined,
      ctr: metricValue(r.clickThroughRate) ?? undefined,
      retention: r.retentionMetrics?.averageViewPercentage,
      revenueUsd: r.revenueMetrics?.estimatedRevenueUsd ?? null,
      confidenceScore: r.confidenceScore,
    }));
    const analyticsReportIds = [
      ...(input.analyticsReportIds ?? []),
      ...reports
        .map((r) => r.analyticsReportId)
        .filter((id): id is string => Boolean(id)),
    ];
    return {
      ...input,
      analyticsSignals: analyticsSignals.length > 0 ? analyticsSignals : null,
      analyticsReportIds: analyticsReportIds.length
        ? [...new Set(analyticsReportIds)]
        : null,
      channelIdHint:
        input.channelIdHint ??
        reports.find((r) => r.channelId)?.channelId ??
        null,
    };
  }

  enrichFromMediaLearningWorker(
    input: ChannelRecommendationWorkerInput,
  ): ChannelRecommendationWorkerInput {
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
        learningReportIds:
          input.learningReportIds && input.learningReportIds.length > 0
            ? input.learningReportIds
            : latestId
              ? [latestId]
              : input.learningReportIds ?? null,
      };
    }
    const learningSignals: LearningSignal[] = reports.map((r) => ({
      learningReportId: r.learningReportId,
      channelId: r.channelId,
      successfulPatternCount: r.successfulPatterns?.length ?? 0,
      failedPatternCount: r.failedPatterns?.length ?? 0,
      confidenceScore: r.confidenceScore,
      topInsight: r.topicInsights?.[0]?.summary,
    }));
    const learningReportIds = [
      ...(input.learningReportIds ?? []),
      ...reports
        .map((r) => r.learningReportId)
        .filter((id): id is string => Boolean(id)),
    ];
    return {
      ...input,
      learningSignals: learningSignals.length > 0 ? learningSignals : null,
      learningReportIds: learningReportIds.length
        ? [...new Set(learningReportIds)]
        : null,
      channelIdHint:
        input.channelIdHint ??
        reports.find((r) => r.channelId)?.channelId ??
        null,
    };
  }

  enrichInput(input: ChannelRecommendationWorkerInput): ChannelRecommendationWorkerInput {
    let enriched = this.enrichFromTrendResearchWorker(input);
    enriched = this.enrichFromMediaAnalyticsWorker(enriched);
    enriched = this.enrichFromMediaLearningWorker(enriched);
    return enriched;
  }

  submitReport(reports: ChannelRecommendationReport[]): {
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
        details: "no_recommendation_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId ?? primary.proposedChannel.channelName,
      missionId: "Q4-17",
      currentStatus: "channel_recommendation_ready",
      progress: Math.min(100, Math.max(40, primary.overallScore)),
      blockers: [],
      risks:
        primary.riskAssessment.overallRisk === "high"
          ? [`high_risk:${primary.riskAssessment.riskScore}`]
          : [],
      evidence: [
        `channel:${primary.proposedChannel.channelName}`,
        `platform:${primary.proposedChannel.platform}`,
        `niche:${primary.proposedChannel.niche}`,
        `decision:${primary.recommendation}`,
        `overallScore:${primary.overallScore}`,
        `confidence:${primary.confidenceScore}`,
        `evidenceCount:${primary.supportingEvidence.length}`,
      ],
      nextAction: "await_pillow_grand_king_decision_no_channel_creation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      recommendationReportCount: reports.length,
      neverCreatedChannelsAutomatically: true,
      neverCreateChannels: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-crw-${Date.now()}`;
    appendCrwLog({
      event: "submit_report",
      details: `recommendationReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.workerName,
      workerType: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.workerType,
      department: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.department,
      factory: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.factory,
      role: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.role,
      reportingLine: [...CHANNEL_RECOMMENDATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...CHANNEL_RECOMMENDATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...CHANNEL_RECOMMENDATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: CHANNEL_RECOMMENDATION_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-17",
        requiredSkills: [...CHANNEL_RECOMMENDATION_WORKER_IDENTITY.skillProfile],
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
      case "trend_research_worker":
        return Boolean(this.deps.trendResearchWorker?.getTrendReports);
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
    return `Channel Recommendation Worker ${workerId} ↔ ${target} (${status})`;
  }
}

function metricValue(raw: number | { value?: number } | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw.value === "number" && Number.isFinite(raw.value)) return raw.value;
  return null;
}
