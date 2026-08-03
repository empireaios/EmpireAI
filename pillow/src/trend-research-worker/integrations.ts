import { TREND_RESEARCH_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  TrendResearchReport,
  TrendResearchWorkerInput,
} from "./types.js";
import { appendTrwLog } from "./trw-logging.js";

/** Optional live workforce integrations for Q4-03 Trend Research Worker. */
export type TrendResearchWorkerDependencies = {
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
  mediaFactoryCore?: {
    getLatestMissionId?: () => string | null;
    getMissions?: () => Array<{
      mediaMissionId?: string | null;
      mediaBusinessId?: string | null;
      channelId?: string | null;
      channelName?: string | null;
    }>;
  } | null;
  editorInChiefWorker?: {
    getLatestEditorialReportId?: () => string | null;
    getEditorialReports?: () => Array<{
      editorialReportId?: string | null;
      channelId?: string | null;
      mediaBusinessId?: string | null;
      mediaMissionId?: string | null;
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

export type MediaEnrichmentContext = {
  mediaBusinessId?: string | null;
  mediaMissionId?: string | null;
  channelId?: string | null;
  editorialReportId?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: TrendResearchWorkerDependencies = {};

  bind(deps: TrendResearchWorkerDependencies = {}) {
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
      appendTrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromMediaWorkers(input: TrendResearchWorkerInput): TrendResearchWorkerInput {
    const missions = this.deps.mediaFactoryCore?.getMissions?.() ?? [];
    const editorialReports = this.deps.editorInChiefWorker?.getEditorialReports?.() ?? [];
    const channelId = input.channelId ?? null;
    const missionMatch =
      missions.find(
        (m) =>
          (input.mediaMissionId && m.mediaMissionId === input.mediaMissionId) ||
          (channelId && m.channelId === channelId),
      ) ??
      (missions.length ? missions[missions.length - 1] : null);
    const editorialMatch =
      editorialReports.find(
        (r) =>
          (channelId && r.channelId === channelId) ||
          (input.mediaMissionId && r.mediaMissionId === input.mediaMissionId),
      ) ??
      (editorialReports.length ? editorialReports[editorialReports.length - 1] : null);
    return {
      ...input,
      channelId: input.channelId ?? missionMatch?.channelId ?? editorialMatch?.channelId ?? null,
      mediaBusinessId:
        input.mediaBusinessId ??
        missionMatch?.mediaBusinessId ??
        editorialMatch?.mediaBusinessId ??
        null,
      mediaMissionId:
        input.mediaMissionId ??
        missionMatch?.mediaMissionId ??
        editorialMatch?.mediaMissionId ??
        this.deps.mediaFactoryCore?.getLatestMissionId?.() ??
        null,
    };
  }

  pullMediaContext(input: TrendResearchWorkerInput): {
    enrichment: MediaEnrichmentContext | null;
  } {
    const enriched = this.enrichFromMediaWorkers(input);
    const editorialReports = this.deps.editorInChiefWorker?.getEditorialReports?.() ?? [];
    const editorialMatch = editorialReports.find(
      (r) =>
        (enriched.channelId && r.channelId === enriched.channelId) ||
        (enriched.mediaMissionId && r.mediaMissionId === enriched.mediaMissionId),
    );
    const enrichment: MediaEnrichmentContext | null =
      enriched.channelId || enriched.mediaBusinessId || enriched.mediaMissionId
        ? {
            mediaBusinessId: enriched.mediaBusinessId ?? null,
            mediaMissionId: enriched.mediaMissionId ?? null,
            channelId: enriched.channelId ?? null,
            editorialReportId:
              editorialMatch?.editorialReportId ??
              this.deps.editorInChiefWorker?.getLatestEditorialReportId?.() ??
              null,
          }
        : null;
    return { enrichment };
  }

  submitReport(reports: TrendResearchReport[]): {
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
        details: "no_trend_research_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId,
      missionId: "Q4-03",
      currentStatus: "trend_research_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: reports
        .filter((r) => r.trendDirection === "declining")
        .map((r) => `trend_blocker:${r.trendReportId}:declining`),
      risks: reports
        .filter((r) => r.recommendedPriority === "critical")
        .map((r) => `trend_risk:${r.trendReportId}:critical_priority`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "await_pillow_review_of_trend_opportunities_no_content_generation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      trendReportCount: reports.length,
      trendDirection: primary.trendDirection,
      recommendedPriority: primary.recommendedPriority,
      neverGeneratedContentDirectly: true,
      neverSelectedPublishingTopics: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-trw-${Date.now()}`;
    appendTrwLog({
      event: "submit_report",
      details: `reports=${reports.length} executive=${executiveReportId}`,
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
      workerName: TREND_RESEARCH_WORKER_IDENTITY.workerName,
      workerType: TREND_RESEARCH_WORKER_IDENTITY.workerType,
      department: TREND_RESEARCH_WORKER_IDENTITY.department,
      factory: TREND_RESEARCH_WORKER_IDENTITY.factory,
      role: TREND_RESEARCH_WORKER_IDENTITY.role,
      reportingLine: [...TREND_RESEARCH_WORKER_IDENTITY.reportingLine],
      skillProfile: [...TREND_RESEARCH_WORKER_IDENTITY.skillProfile],
      approvedTools: [...TREND_RESEARCH_WORKER_IDENTITY.approvedTools],
      authorityLevel: TREND_RESEARCH_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-03",
        requiredSkills: [...TREND_RESEARCH_WORKER_IDENTITY.skillProfile],
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
      case "media_factory_core":
        return Boolean(this.deps.mediaFactoryCore?.getMissions);
      case "editor_in_chief_worker":
        return Boolean(this.deps.editorInChiefWorker?.getEditorialReports);
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
    return `Trend Research Worker ${workerId} ↔ ${target} (${status})`;
  }
}
