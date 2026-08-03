import { THUMBNAIL_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  ThumbnailReport,
  ThumbnailWorkerInput,
} from "./types.js";
import { appendThwLog } from "./thw-logging.js";

/** Optional live workforce integrations for Q4-07 Thumbnail Worker. */
export type ThumbnailWorkerDependencies = {
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
  scriptWorker?: {
    getLatestScriptId?: () => string | null;
    getScripts?: () => Array<{
      scriptId?: string;
      channelId?: string;
      topicId?: string;
      contentFormat?: string;
      scriptTitle?: string;
      scriptIntent?: string;
      targetAudience?: string;
    }>;
  } | null;
  hookWorker?: {
    getLatestHookReportId?: () => string | null;
    getHookReports?: () => Array<{
      hookReportId?: string;
      scriptId?: string;
      primaryHook?: { text?: string };
      alternativeHooks?: Array<{ text?: string }>;
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
  private deps: ThumbnailWorkerDependencies = {};

  bind(deps: ThumbnailWorkerDependencies = {}) {
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
      appendThwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: ThumbnailWorkerInput): ThumbnailWorkerInput {
    const scripts = this.deps.scriptWorker?.getScripts?.() ?? [];
    const scriptId = input.scriptId ?? this.deps.scriptWorker?.getLatestScriptId?.() ?? null;
    const scriptMatch =
      (scriptId ? scripts.find((s) => s.scriptId === scriptId) : null) ??
      (scripts.length ? scripts[scripts.length - 1] : null);
    return {
      ...input,
      scriptId: input.scriptId ?? scriptMatch?.scriptId ?? scriptId ?? null,
      channelId: input.channelId ?? scriptMatch?.channelId ?? null,
      topicId: input.topicId ?? scriptMatch?.topicId ?? null,
      contentFormat: input.contentFormat ?? scriptMatch?.contentFormat ?? null,
      scriptTitle: input.scriptTitle ?? scriptMatch?.scriptTitle ?? null,
      scriptIntent: input.scriptIntent ?? scriptMatch?.scriptIntent ?? null,
      targetAudience: input.targetAudience ?? scriptMatch?.targetAudience ?? null,
    };
  }

  enrichFromHookWorker(input: ThumbnailWorkerInput): ThumbnailWorkerInput {
    const reports = this.deps.hookWorker?.getHookReports?.() ?? [];
    const hookReportId =
      input.hookReportId ?? this.deps.hookWorker?.getLatestHookReportId?.() ?? null;
    const hookMatch =
      (hookReportId ? reports.find((r) => r.hookReportId === hookReportId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    return {
      ...input,
      hookReportId: input.hookReportId ?? hookMatch?.hookReportId ?? hookReportId ?? null,
      primaryHookText:
        input.primaryHookText ?? hookMatch?.primaryHook?.text ?? input.primaryHookText ?? null,
      alternativeHookTexts:
        input.alternativeHookTexts ??
        hookMatch?.alternativeHooks?.map((h) => h.text ?? "").filter(Boolean) ??
        null,
    };
  }

  enrichInput(input: ThumbnailWorkerInput): ThumbnailWorkerInput {
    return this.enrichFromHookWorker(this.enrichFromScriptWorker(input));
  }

  submitReport(reports: ThumbnailReport[]): {
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
        details: "no_thumbnail_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-07",
      currentStatus: "thumbnail_concepts_ready",
      progress: Math.round(primary.confidenceScore),
      blockers: reports
        .filter((r) => !r.selfReviewPassed)
        .map((r) => `self_review_blocker:${r.thumbnailReportId}:failed`),
      risks: [],
      evidence: [
        `primaryConcept:${primary.primaryConcept.conceptId}`,
        ...primary.abVariants.map((v) => `abVariant:${v.variantId}`),
        ...primary.emotionalTriggers.map((e) => `trigger:${e.trigger}`),
      ],
      nextAction: "await_image_generation_workers_no_direct_artwork",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      thumbnailReportCount: reports.length,
      contentFormat: primary.contentFormat,
      neverGeneratedFinalArtwork: true,
      neverPublishedThumbnails: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-thw-${Date.now()}`;
    appendThwLog({
      event: "submit_report",
      details: `thumbnailReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: THUMBNAIL_WORKER_IDENTITY.workerName,
      workerType: THUMBNAIL_WORKER_IDENTITY.workerType,
      department: THUMBNAIL_WORKER_IDENTITY.department,
      factory: THUMBNAIL_WORKER_IDENTITY.factory,
      role: THUMBNAIL_WORKER_IDENTITY.role,
      reportingLine: [...THUMBNAIL_WORKER_IDENTITY.reportingLine],
      skillProfile: [...THUMBNAIL_WORKER_IDENTITY.skillProfile],
      approvedTools: [...THUMBNAIL_WORKER_IDENTITY.approvedTools],
      authorityLevel: THUMBNAIL_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-07",
        requiredSkills: [...THUMBNAIL_WORKER_IDENTITY.skillProfile],
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
      case "script_worker":
        return Boolean(this.deps.scriptWorker?.getScripts);
      case "hook_worker":
        return Boolean(this.deps.hookWorker?.getHookReports);
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
    return `Thumbnail Worker ${workerId} ↔ ${target} (${status})`;
  }
}
