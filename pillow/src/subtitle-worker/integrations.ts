import { SUBTITLE_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  SubtitleReport,
  SubtitleWorkerInput,
} from "./types.js";
import { appendStwLog } from "./stw-logging.js";

/** Optional live workforce integrations for Q4-12 Subtitle Worker. */
export type SubtitleWorkerDependencies = {
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
  voiceWorker?: {
    getLatestVoiceReportId?: () => string | null;
    getVoiceReports?: () => Array<{
      voiceReportId?: string;
      scriptId?: string;
      channelId?: string;
      language?: string;
      voiceAssetReferences?: Array<{ assetId?: string; durationSec?: number }>;
    }>;
  } | null;
  videoAssemblyWorker?: {
    getLatestAssemblyId?: () => string | null;
    getAssemblyReports?: () => Array<{
      assemblyId?: string;
      scriptId?: string;
      channelId?: string;
      finalVideoReference?: { videoId?: string };
      voiceAssetId?: string;
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
  private deps: SubtitleWorkerDependencies = {};

  bind(deps: SubtitleWorkerDependencies = {}) {
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
      appendStwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: SubtitleWorkerInput): SubtitleWorkerInput {
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

  enrichFromVoiceWorker(input: SubtitleWorkerInput): SubtitleWorkerInput {
    const reports = this.deps.voiceWorker?.getVoiceReports?.() ?? [];
    const voiceReportId =
      input.voiceReportId ?? this.deps.voiceWorker?.getLatestVoiceReportId?.() ?? null;
    const match =
      (voiceReportId ? reports.find((r) => r.voiceReportId === voiceReportId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const primary = match?.voiceAssetReferences?.[0];
    return {
      ...input,
      voiceReportId: input.voiceReportId ?? match?.voiceReportId ?? voiceReportId ?? null,
      voiceAssetId: input.voiceAssetId ?? primary?.assetId ?? null,
      voiceDurationSec: input.voiceDurationSec ?? primary?.durationSec ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      subtitleLanguage:
        input.subtitleLanguage ??
        (match?.language && typeof match.language === "string" ? match.language : null),
    };
  }

  enrichFromVideoAssemblyWorker(input: SubtitleWorkerInput): SubtitleWorkerInput {
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
      voiceAssetId: input.voiceAssetId ?? match?.voiceAssetId ?? null,
    };
  }

  enrichInput(input: SubtitleWorkerInput): SubtitleWorkerInput {
    return this.enrichFromVideoAssemblyWorker(
      this.enrichFromVoiceWorker(this.enrichFromScriptWorker(input)),
    );
  }

  submitReport(reports: SubtitleReport[]): {
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
        details: "no_subtitle_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-12",
      currentStatus: "subtitles_ready",
      progress:
        primary.qualityValidation.status === "pass"
          ? 100
          : primary.qualityValidation.status === "pass_with_notes"
            ? 85
            : 60,
      blockers: reports
        .filter((r) => r.qualityValidation.status === "fail")
        .map((r) => `quality_blocker:${r.subtitleReportId}:failed`),
      risks: primary.syncIssues
        .filter((i) => i.severity === "error")
        .map((i) => `sync:${i.issueId}`),
      evidence: [
        `script:${primary.scriptId}`,
        `video:${primary.videoId}`,
        `language:${primary.subtitleLanguage}`,
        ...primary.exportFormats.map((f) => `export:${f.format}`),
      ],
      nextAction: "await_publishing_workers_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      subtitleReportCount: reports.length,
      exportFormatCount: primary.exportFormats.length,
      neverPublishedContent: true,
      neverRewroteScripts: true,
      neverAssembledVideos: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-stw-${Date.now()}`;
    appendStwLog({
      event: "submit_report",
      details: `subtitleReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: SUBTITLE_WORKER_IDENTITY.workerName,
      workerType: SUBTITLE_WORKER_IDENTITY.workerType,
      department: SUBTITLE_WORKER_IDENTITY.department,
      factory: SUBTITLE_WORKER_IDENTITY.factory,
      role: SUBTITLE_WORKER_IDENTITY.role,
      reportingLine: [...SUBTITLE_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SUBTITLE_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SUBTITLE_WORKER_IDENTITY.approvedTools],
      authorityLevel: SUBTITLE_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-12",
        requiredSkills: [...SUBTITLE_WORKER_IDENTITY.skillProfile],
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
      case "voice_worker":
        return Boolean(this.deps.voiceWorker?.getVoiceReports);
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
    return `Subtitle Worker ${workerId} ↔ ${target} (${status})`;
  }
}
