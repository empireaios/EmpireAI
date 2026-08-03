import { PUBLISHING_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  PublishingReport,
  PublishingWorkerInput,
} from "./types.js";
import { appendPbwLog } from "./pbw-logging.js";

/** Optional live workforce integrations for Q4-14 Publishing Worker. */
export type PublishingWorkerDependencies = {
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
  videoAssemblyWorker?: {
    getLatestAssemblyId?: () => string | null;
    getAssemblyReports?: () => Array<{
      assemblyId?: string;
      scriptId?: string;
      channelId?: string;
      finalVideoReference?: { videoId?: string };
    }>;
  } | null;
  thumbnailWorker?: {
    getLatestThumbnailId?: () => string | null;
    getThumbnailReports?: () => Array<{
      thumbnailId?: string;
      assetPath?: string;
      scriptId?: string;
      channelId?: string;
      approved?: boolean;
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
  private deps: PublishingWorkerDependencies = {};

  bind(deps: PublishingWorkerDependencies = {}) {
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
      appendPbwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromVideoAssemblyWorker(input: PublishingWorkerInput): PublishingWorkerInput {
    const reports = this.deps.videoAssemblyWorker?.getAssemblyReports?.() ?? [];
    const assemblyId =
      input.assemblyId ?? this.deps.videoAssemblyWorker?.getLatestAssemblyId?.() ?? null;
    const match =
      (assemblyId ? reports.find((r) => r.assemblyId === assemblyId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    return {
      ...input,
      assemblyId: input.assemblyId ?? match?.assemblyId ?? assemblyId ?? null,
      mediaId: input.mediaId ?? match?.finalVideoReference?.videoId ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
    };
  }

  enrichFromThumbnailWorker(input: PublishingWorkerInput): PublishingWorkerInput {
    const reports = this.deps.thumbnailWorker?.getThumbnailReports?.() ?? [];
    const thumbnailId =
      input.thumbnailId ?? this.deps.thumbnailWorker?.getLatestThumbnailId?.() ?? null;
    const match =
      (thumbnailId ? reports.find((r) => r.thumbnailId === thumbnailId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (input.channelId ? reports.find((r) => r.channelId === input.channelId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const approvedMatch =
      match?.approved === false
        ? reports.find((r) => r.approved !== false) ?? match
        : match;
    return {
      ...input,
      thumbnailId: input.thumbnailId ?? approvedMatch?.thumbnailId ?? thumbnailId ?? null,
      thumbnailPath: input.thumbnailPath ?? approvedMatch?.assetPath ?? null,
      scriptId: input.scriptId ?? approvedMatch?.scriptId ?? null,
      channelId: input.channelId ?? approvedMatch?.channelId ?? null,
    };
  }

  enrichInput(input: PublishingWorkerInput): PublishingWorkerInput {
    return this.enrichFromThumbnailWorker(this.enrichFromVideoAssemblyWorker(input));
  }

  submitReport(reports: PublishingReport[]): {
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
        details: "no_publishing_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-14",
      currentStatus: "publishing_package_ready",
      progress:
        primary.publishingReadiness.status === "ready"
          ? 100
          : primary.publishingReadiness.status === "pending_approval"
            ? 85
            : primary.publishingReadiness.status === "not_ready"
              ? 60
              : 40,
      blockers: reports
        .filter((r) => r.publishingReadiness.status === "blocked")
        .map((r) => `readiness_blocker:${r.publishingReportId}:blocked`),
      risks: [],
      evidence: [
        `media:${primary.mediaId}`,
        `platform:${primary.targetPlatform}`,
        `title:${primary.videoTitle}`,
        `readiness:${primary.publishingReadiness.status}`,
        `approval:${primary.approvalStatus}`,
        `thumbnail:${primary.thumbnailReference.thumbnailId}`,
        `package:${primary.uploadPackage.packageId}`,
      ],
      nextAction: "await_pillow_approval_before_any_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      publishingReportCount: reports.length,
      neverAutomaticallyPublished: true,
      pillowAuthorizationRequired: true,
      automaticallyPublishAuthorized: false,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-pbw-${Date.now()}`;
    appendPbwLog({
      event: "submit_report",
      details: `publishingReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: PUBLISHING_WORKER_IDENTITY.workerName,
      workerType: PUBLISHING_WORKER_IDENTITY.workerType,
      department: PUBLISHING_WORKER_IDENTITY.department,
      factory: PUBLISHING_WORKER_IDENTITY.factory,
      role: PUBLISHING_WORKER_IDENTITY.role,
      reportingLine: [...PUBLISHING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PUBLISHING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PUBLISHING_WORKER_IDENTITY.approvedTools],
      authorityLevel: PUBLISHING_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-14",
        requiredSkills: [...PUBLISHING_WORKER_IDENTITY.skillProfile],
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
      case "video_assembly_worker":
        return Boolean(this.deps.videoAssemblyWorker?.getAssemblyReports);
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
    return `Publishing Worker ${workerId} ↔ ${target} (${status})`;
  }
}
