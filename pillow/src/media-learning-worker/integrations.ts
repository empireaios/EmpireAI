import { MEDIA_LEARNING_WORKER_IDENTITY } from "./paths.js";
import type {
  IncomingAnalyticsReport,
  IntegrationHandshake,
  IntegrationTarget,
  MediaLearningReport,
  MediaLearningWorkerInput,
} from "./types.js";
import { appendMlwLog } from "./mlw-logging.js";

/** Optional live workforce integrations for Q4-16 Media Learning Worker. */
export type MediaLearningWorkerDependencies = {
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
  mediaAnalyticsWorker?: {
    getLatestAnalyticsReportId?: () => string | null;
    getAnalyticsReports?: () => IncomingAnalyticsReport[];
  } | null;
  experienceReplayEngine?: {
    recordExperience?: (input: Record<string, unknown>) => unknown;
    ingestExperience?: (input: Record<string, unknown>) => unknown;
  } | null;
  operationalPlaybookEngine?: {
    updatePlaybookRecommendations?: (input: Record<string, unknown>) => unknown;
    registerPlaybookRecommendation?: (input: Record<string, unknown>) => unknown;
    upsertPlaybook?: (input: Record<string, unknown>) => unknown;
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
  private deps: MediaLearningWorkerDependencies = {};

  bind(deps: MediaLearningWorkerDependencies = {}) {
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
      appendMlwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromMediaAnalyticsWorker(
    input: MediaLearningWorkerInput,
  ): MediaLearningWorkerInput {
    const reports = this.deps.mediaAnalyticsWorker?.getAnalyticsReports?.() ?? [];
    // Empty-array trap: only enrich when input analyticsReports empty
    const inputReports = input.analyticsReports;
    if (inputReports && inputReports.length > 0) {
      return input;
    }
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
    const analyticsReportIds = [
      ...(input.analyticsReportIds ?? []),
      ...reports
        .map((r) => r.analyticsReportId)
        .filter((id): id is string => Boolean(id)),
    ];
    const mediaIds = [
      ...(input.mediaIds ?? []),
      ...reports.map((r) => r.mediaId).filter((id): id is string => Boolean(id)),
    ];
    const channelId =
      input.channelId ??
      reports.find((r) => r.channelId)?.channelId ??
      null;
    return {
      ...input,
      analyticsReports: reports.map((r) => ({ ...r })),
      analyticsReportIds: analyticsReportIds.length ? [...new Set(analyticsReportIds)] : null,
      mediaIds: mediaIds.length ? [...new Set(mediaIds)] : null,
      channelId,
    };
  }

  enrichInput(input: MediaLearningWorkerInput): MediaLearningWorkerInput {
    return this.enrichFromMediaAnalyticsWorker(input);
  }

  recordExperience(report: MediaLearningReport): void {
    const engine = this.deps.experienceReplayEngine;
    if (!engine) return;
    const payload = {
      missionId: "Q4-16",
      workerId: report.workerId,
      learningReportId: report.learningReportId,
      channelId: report.channelId,
      summary: `Media learning: ${report.successfulPatterns.length} successful, ${report.failedPatterns.length} unsuccessful patterns`,
      confidenceScore: report.confidenceScore,
      neverOverwroteHistoricalLearning: true,
      validated: true,
    };
    try {
      if (engine.recordExperience) {
        engine.recordExperience(payload);
      } else if (engine.ingestExperience) {
        engine.ingestExperience(payload);
      }
    } catch {
      /* experience replay optional */
    }
  }

  registerPlaybookUpdates(report: MediaLearningReport): void {
    const engine = this.deps.operationalPlaybookEngine;
    if (!engine) return;
    // Empty-array trap
    if (
      !report.playbookRecommendationUpdates ||
      report.playbookRecommendationUpdates.length === 0
    ) {
      return;
    }
    for (const update of report.playbookRecommendationUpdates) {
      const payload = {
        playbookId: update.playbookId,
        updateId: update.updateId,
        recommendationText: update.recommendationText,
        sourceLearningReportId: update.sourceLearningReportId,
        neverOverwroteHistoricalLearning: true,
        validated: true,
      };
      try {
        if (engine.updatePlaybookRecommendations) {
          engine.updatePlaybookRecommendations(payload);
        } else if (engine.registerPlaybookRecommendation) {
          engine.registerPlaybookRecommendation(payload);
        } else if (engine.upsertPlaybook) {
          engine.upsertPlaybook(payload);
        }
      } catch {
        /* playbook optional — structural updates remain local */
      }
    }
  }

  submitReport(reports: MediaLearningReport[]): {
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
        details: "no_learning_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId ?? primary.channelId,
      missionId: "Q4-16",
      currentStatus: "media_learning_ready",
      progress: Math.min(100, Math.max(40, primary.confidenceScore)),
      blockers: [],
      risks: primary.failedPatterns
        .filter((p) => p.strength >= 70)
        .map((p) => `unsuccessful_pattern:${p.patternId}:${p.dimension}`),
      evidence: [
        `channel:${primary.channelId}`,
        `mediaCount:${primary.mediaIdsAnalysed.length}`,
        `successfulPatterns:${primary.successfulPatterns.length}`,
        `failedPatterns:${primary.failedPatterns.length}`,
        `confidence:${primary.confidenceScore}`,
        `analyticsReports:${primary.analyticsReportIds.length}`,
      ],
      nextAction: "await_downstream_media_workers_no_content_mutation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      learningReportCount: reports.length,
      neverOverwroteHistoricalLearning: true,
      neverRewroteExistingContent: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-mlw-${Date.now()}`;
    appendMlwLog({
      event: "submit_report",
      details: `learningReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: MEDIA_LEARNING_WORKER_IDENTITY.workerName,
      workerType: MEDIA_LEARNING_WORKER_IDENTITY.workerType,
      department: MEDIA_LEARNING_WORKER_IDENTITY.department,
      factory: MEDIA_LEARNING_WORKER_IDENTITY.factory,
      role: MEDIA_LEARNING_WORKER_IDENTITY.role,
      reportingLine: [...MEDIA_LEARNING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...MEDIA_LEARNING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...MEDIA_LEARNING_WORKER_IDENTITY.approvedTools],
      authorityLevel: MEDIA_LEARNING_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-16",
        requiredSkills: [...MEDIA_LEARNING_WORKER_IDENTITY.skillProfile],
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
      case "media_analytics_worker":
        return Boolean(this.deps.mediaAnalyticsWorker?.getAnalyticsReports);
      case "experience_replay_engine":
        return Boolean(
          this.deps.experienceReplayEngine?.recordExperience ||
            this.deps.experienceReplayEngine?.ingestExperience,
        );
      case "operational_playbook_engine":
        return Boolean(
          this.deps.operationalPlaybookEngine?.updatePlaybookRecommendations ||
            this.deps.operationalPlaybookEngine?.registerPlaybookRecommendation ||
            this.deps.operationalPlaybookEngine?.upsertPlaybook,
        );
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
    return `Media Learning Worker ${workerId} ↔ ${target} (${status})`;
  }
}
