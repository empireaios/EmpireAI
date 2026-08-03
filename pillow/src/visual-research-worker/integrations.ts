import { VISUAL_RESEARCH_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  VisualResearchReport,
  VisualResearchWorkerInput,
} from "./types.js";
import { appendVrwLog } from "./vrw-logging.js";

/** Optional live workforce integrations for Q4-08 Visual Research Worker. */
export type VisualResearchWorkerDependencies = {
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
      scriptSections?: Array<{ sectionId?: string; title?: string; content?: string }>;
    }>;
  } | null;
  thumbnailWorker?: {
    getLatestThumbnailReportId?: () => string | null;
    getThumbnailReports?: () => Array<{
      thumbnailReportId?: string;
      scriptId?: string;
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
  private deps: VisualResearchWorkerDependencies = {};

  bind(deps: VisualResearchWorkerDependencies = {}) {
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
      appendVrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: VisualResearchWorkerInput): VisualResearchWorkerInput {
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
      scriptSections: input.scriptSections ?? scriptMatch?.scriptSections ?? null,
    };
  }

  enrichFromThumbnailWorker(input: VisualResearchWorkerInput): VisualResearchWorkerInput {
    const reports = this.deps.thumbnailWorker?.getThumbnailReports?.() ?? [];
    const thumbnailReportId =
      input.thumbnailReportId ?? this.deps.thumbnailWorker?.getLatestThumbnailReportId?.() ?? null;
    const thumbMatch =
      (thumbnailReportId ? reports.find((r) => r.thumbnailReportId === thumbnailReportId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    return {
      ...input,
      thumbnailReportId:
        input.thumbnailReportId ?? thumbMatch?.thumbnailReportId ?? thumbnailReportId ?? null,
    };
  }

  enrichInput(input: VisualResearchWorkerInput): VisualResearchWorkerInput {
    return this.enrichFromThumbnailWorker(this.enrichFromScriptWorker(input));
  }

  submitReport(reports: VisualResearchReport[]): {
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
        details: "no_visual_research_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-08",
      currentStatus: "visual_research_ready",
      progress: Math.round(primary.confidenceScore),
      blockers: primary.missingAssets.map((a) => `missing_asset:${a}`),
      risks: primary.licensingRestrictions
        .filter((l) => l.severity === "error")
        .map((l) => `licensing:${l.restrictionId}`),
      evidence: [
        `scenes:${primary.scenes.length}`,
        ...primary.scenes.map((s) => `scene:${s.sceneNumber}:${s.assetType}`),
      ],
      nextAction: "await_creative_assembly_workers_no_direct_asset_generation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      visualResearchReportCount: reports.length,
      contentFormat: primary.contentFormat,
      neverGeneratedFinalCreativeAssets: true,
      neverPublishedContent: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-vrw-${Date.now()}`;
    appendVrwLog({
      event: "submit_report",
      details: `visualResearchReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: VISUAL_RESEARCH_WORKER_IDENTITY.workerName,
      workerType: VISUAL_RESEARCH_WORKER_IDENTITY.workerType,
      department: VISUAL_RESEARCH_WORKER_IDENTITY.department,
      factory: VISUAL_RESEARCH_WORKER_IDENTITY.factory,
      role: VISUAL_RESEARCH_WORKER_IDENTITY.role,
      reportingLine: [...VISUAL_RESEARCH_WORKER_IDENTITY.reportingLine],
      skillProfile: [...VISUAL_RESEARCH_WORKER_IDENTITY.skillProfile],
      approvedTools: [...VISUAL_RESEARCH_WORKER_IDENTITY.approvedTools],
      authorityLevel: VISUAL_RESEARCH_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-08",
        requiredSkills: [...VISUAL_RESEARCH_WORKER_IDENTITY.skillProfile],
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
      case "thumbnail_worker":
        return Boolean(this.deps.thumbnailWorker?.getThumbnailReports);
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
    return `Visual Research Worker ${workerId} ↔ ${target} (${status})`;
  }
}
