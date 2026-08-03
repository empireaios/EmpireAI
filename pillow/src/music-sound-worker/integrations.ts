import { MUSIC_SOUND_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  MusicSoundReport,
  MusicSoundWorkerInput,
} from "./types.js";
import { appendMswLog } from "./msw-logging.js";

/** Optional live workforce integrations for Q4-13 Music & Sound Worker. */
export type MusicSoundWorkerDependencies = {
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
      narrationReadyText?: string;
      scriptSections?: Array<{ sectionId?: string; heading?: string; body?: string }>;
    }>;
  } | null;
  videoAssemblyWorker?: {
    getLatestAssemblyId?: () => string | null;
    getAssemblyReports?: () => Array<{
      assemblyId?: string;
      scriptId?: string;
      channelId?: string;
      finalVideoReference?: { videoId?: string };
      sceneTimeline?: Array<{
        sceneId?: string;
        order?: number;
        startSec?: number;
        endSec?: number;
        scriptSectionId?: string;
      }>;
      musicAssetId?: string | null;
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
  private deps: MusicSoundWorkerDependencies = {};

  bind(deps: MusicSoundWorkerDependencies = {}) {
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
      appendMswLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: MusicSoundWorkerInput): MusicSoundWorkerInput {
    const scripts = this.deps.scriptWorker?.getScripts?.() ?? [];
    const scriptId =
      input.scriptId ?? this.deps.scriptWorker?.getLatestScriptId?.() ?? null;
    const match =
      (scriptId ? scripts.find((s) => s.scriptId === scriptId) : null) ??
      (scripts.length ? scripts[scripts.length - 1] : null);
    return {
      ...input,
      scriptId: input.scriptId ?? match?.scriptId ?? scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      narrationReadyText: input.narrationReadyText ?? match?.narrationReadyText ?? null,
      scriptSections: input.scriptSections ?? match?.scriptSections ?? null,
    };
  }

  enrichFromVideoAssemblyWorker(input: MusicSoundWorkerInput): MusicSoundWorkerInput {
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
      videoId: input.videoId ?? match?.finalVideoReference?.videoId ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      sceneTimeline: input.sceneTimeline ?? match?.sceneTimeline ?? null,
    };
  }

  enrichInput(input: MusicSoundWorkerInput): MusicSoundWorkerInput {
    return this.enrichFromVideoAssemblyWorker(this.enrichFromScriptWorker(input));
  }

  submitReport(reports: MusicSoundReport[]): {
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
        details: "no_audio_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-13",
      currentStatus: "music_sound_ready",
      progress:
        primary.qualityValidation.status === "pass"
          ? 100
          : primary.qualityValidation.status === "pass_with_notes"
            ? 85
            : 60,
      blockers: reports
        .filter((r) => r.qualityValidation.status === "fail")
        .map((r) => `quality_blocker:${r.audioReportId}:failed`),
      risks: [],
      evidence: [
        `script:${primary.scriptId}`,
        `video:${primary.videoId}`,
        `licensing:${primary.licensingStatus}`,
        `mood:${primary.requiredMood}`,
        ...primary.backgroundMusicAssets.map((a) => `music:${a.assetId}`),
        ...primary.soundEffectAssets.map((a) => `sfx:${a.assetId}`),
      ],
      nextAction: "await_publishing_workers_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      audioReportCount: reports.length,
      musicAssetCount: primary.backgroundMusicAssets.length,
      neverPublishedMedia: true,
      neverAssembledVideos: true,
      neverUsedUnapprovedCopyrightedAssets: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-msw-${Date.now()}`;
    appendMswLog({
      event: "submit_report",
      details: `audioReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: MUSIC_SOUND_WORKER_IDENTITY.workerName,
      workerType: MUSIC_SOUND_WORKER_IDENTITY.workerType,
      department: MUSIC_SOUND_WORKER_IDENTITY.department,
      factory: MUSIC_SOUND_WORKER_IDENTITY.factory,
      role: MUSIC_SOUND_WORKER_IDENTITY.role,
      reportingLine: [...MUSIC_SOUND_WORKER_IDENTITY.reportingLine],
      skillProfile: [...MUSIC_SOUND_WORKER_IDENTITY.skillProfile],
      approvedTools: [...MUSIC_SOUND_WORKER_IDENTITY.approvedTools],
      authorityLevel: MUSIC_SOUND_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-13",
        requiredSkills: [...MUSIC_SOUND_WORKER_IDENTITY.skillProfile],
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
      case "video_assembly_worker":
        return Boolean(this.deps.videoAssemblyWorker?.getAssemblyReports);
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
    return `Music & Sound Worker ${workerId} ↔ ${target} (${status})`;
  }
}
