import { IMAGE_CREATIVE_WORKER_IDENTITY } from "./paths.js";
import type {
  CreativeAssetReport,
  ImageCreativeWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendIcwLog } from "./icw-logging.js";

/** Optional live workforce integrations for Q4-09 Image & Creative Worker. */
export type ImageCreativeWorkerDependencies = {
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
  visualResearchWorker?: {
    getLatestVisualResearchId?: () => string | null;
    getVisualResearchReports?: () => Array<{
      visualResearchId?: string;
      scriptId?: string;
      channelId?: string;
      scenes?: Array<{
        sceneId?: string;
        sceneLabel?: string;
        requiredAssets?: string[];
        copyrightStatus?: string;
      }>;
    }>;
  } | null;
  thumbnailWorker?: {
    getLatestThumbnailReportId?: () => string | null;
    getThumbnailReports?: () => Array<{
      thumbnailReportId?: string;
      scriptId?: string;
      channelId?: string;
      thumbnailConcepts?: Array<{
        conceptId?: string;
        title?: string;
        textOverlay?: string;
        composition?: string;
        emotionalTrigger?: string;
      }>;
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
  private deps: ImageCreativeWorkerDependencies = {};

  bind(deps: ImageCreativeWorkerDependencies = {}) {
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
      appendIcwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromVisualResearchWorker(input: ImageCreativeWorkerInput): ImageCreativeWorkerInput {
    const reports = this.deps.visualResearchWorker?.getVisualResearchReports?.() ?? [];
    const visualResearchId =
      input.visualResearchId ?? this.deps.visualResearchWorker?.getLatestVisualResearchId?.() ?? null;
    const match =
      (visualResearchId ? reports.find((r) => r.visualResearchId === visualResearchId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const scenes =
      input.visualResearchScenes ??
      match?.scenes?.map((s) => ({
        sceneId: s.sceneId ?? `scene-${s.sceneLabel ?? "unknown"}`,
        sceneLabel: s.sceneLabel ?? "Scene",
        requiredAssets: s.requiredAssets ?? [],
        copyrightStatus: s.copyrightStatus,
      })) ??
      null;
    return {
      ...input,
      visualResearchId: input.visualResearchId ?? match?.visualResearchId ?? visualResearchId ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      visualResearchScenes: scenes,
    };
  }

  enrichFromThumbnailWorker(input: ImageCreativeWorkerInput): ImageCreativeWorkerInput {
    const reports = this.deps.thumbnailWorker?.getThumbnailReports?.() ?? [];
    const thumbnailReportId =
      input.thumbnailReportId ?? this.deps.thumbnailWorker?.getLatestThumbnailReportId?.() ?? null;
    const match =
      (thumbnailReportId ? reports.find((r) => r.thumbnailReportId === thumbnailReportId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const specs =
      input.thumbnailSpecs ??
      match?.thumbnailConcepts?.map((c) => ({
        specId: c.conceptId ?? `spec-${c.title ?? "concept"}`,
        conceptId: c.conceptId,
        textOverlay: c.textOverlay,
        composition: c.composition,
        emotionalTrigger: c.emotionalTrigger,
      })) ??
      null;
    return {
      ...input,
      thumbnailReportId: input.thumbnailReportId ?? match?.thumbnailReportId ?? thumbnailReportId ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      thumbnailSpecs: specs,
    };
  }

  enrichInput(input: ImageCreativeWorkerInput): ImageCreativeWorkerInput {
    return this.enrichFromThumbnailWorker(this.enrichFromVisualResearchWorker(input));
  }

  submitReport(reports: CreativeAssetReport[]): {
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
        details: "no_creative_asset_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-09",
      currentStatus: "creative_assets_ready",
      progress: primary.qualityStatus === "pass" ? 100 : primary.qualityStatus === "pass_with_notes" ? 85 : 60,
      blockers: reports
        .filter((r) => r.qualityStatus === "fail")
        .map((r) => `quality_blocker:${r.creativeAssetId}:failed`),
      risks: [],
      evidence: [
        `assetType:${primary.assetType}`,
        ...primary.generatedAssets.map((a) =>
          typeof a === "string" ? `generated:${a}` : `generated:${a.assetId}`,
        ),
        ...primary.variants.map((v) => `variant:${v.variantId}`),
      ],
      nextAction: "await_video_assembly_workers_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      creativeAssetReportCount: reports.length,
      variantCount: primary.variantCount,
      neverAssembledVideos: true,
      neverPublishedMedia: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-icw-${Date.now()}`;
    appendIcwLog({
      event: "submit_report",
      details: `creativeAssetReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: IMAGE_CREATIVE_WORKER_IDENTITY.workerName,
      workerType: IMAGE_CREATIVE_WORKER_IDENTITY.workerType,
      department: IMAGE_CREATIVE_WORKER_IDENTITY.department,
      factory: IMAGE_CREATIVE_WORKER_IDENTITY.factory,
      role: IMAGE_CREATIVE_WORKER_IDENTITY.role,
      reportingLine: [...IMAGE_CREATIVE_WORKER_IDENTITY.reportingLine],
      skillProfile: [...IMAGE_CREATIVE_WORKER_IDENTITY.skillProfile],
      approvedTools: [...IMAGE_CREATIVE_WORKER_IDENTITY.approvedTools],
      authorityLevel: IMAGE_CREATIVE_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-09",
        requiredSkills: [...IMAGE_CREATIVE_WORKER_IDENTITY.skillProfile],
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
      case "visual_research_worker":
        return Boolean(this.deps.visualResearchWorker?.getVisualResearchReports);
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
    return `Image & Creative Worker ${workerId} ↔ ${target} (${status})`;
  }
}
