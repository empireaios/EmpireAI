import { VIDEO_ASSEMBLY_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  VideoAssemblyReport,
  VideoAssemblyWorkerInput,
} from "./types.js";
import { appendVawLog } from "./vaw-logging.js";

/** Optional live workforce integrations for Q4-11 Video Assembly Worker. */
export type VideoAssemblyWorkerDependencies = {
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
      voiceAssetReferences?: Array<{ assetId?: string; assetPath?: string; durationSec?: number }>;
    }>;
  } | null;
  imageCreativeWorker?: {
    getLatestCreativeAssetId?: () => string | null;
    getCreativeAssetReports?: () => Array<{
      creativeAssetId?: string;
      scriptId?: string;
      channelId?: string;
      generatedAssets?: Array<string | { assetId?: string; assetPath?: string; assetType?: string }>;
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
  private deps: VideoAssemblyWorkerDependencies = {};

  bind(deps: VideoAssemblyWorkerDependencies = {}) {
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
      appendVawLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: VideoAssemblyWorkerInput): VideoAssemblyWorkerInput {
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
      topicId: input.topicId ?? match?.topicId ?? null,
      narrationReadyText: input.narrationReadyText ?? match?.narrationReadyText ?? null,
      scriptSections: input.scriptSections ?? match?.scriptSections ?? null,
    };
  }

  enrichFromVoiceWorker(input: VideoAssemblyWorkerInput): VideoAssemblyWorkerInput {
    const reports = this.deps.voiceWorker?.getVoiceReports?.() ?? [];
    const voiceReportId =
      input.voiceReportId ?? this.deps.voiceWorker?.getLatestVoiceReportId?.() ?? null;
    const match =
      (voiceReportId ? reports.find((r) => r.voiceReportId === voiceReportId) : null) ??
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const primaryAsset = match?.voiceAssetReferences?.[0];
    return {
      ...input,
      voiceReportId: input.voiceReportId ?? match?.voiceReportId ?? voiceReportId ?? null,
      voiceAssetId: input.voiceAssetId ?? primaryAsset?.assetId ?? null,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      voiceAssets:
        input.voiceAssets ??
        match?.voiceAssetReferences?.map((a) => ({
          assetId: a.assetId ?? "voice-unknown",
          assetPath: a.assetPath ?? `assets/voice/${a.assetId ?? "unknown"}.descriptor.json`,
          assetKind: "voice" as const,
          durationSec: a.durationSec,
        })) ??
        null,
    };
  }

  enrichFromImageCreativeWorker(input: VideoAssemblyWorkerInput): VideoAssemblyWorkerInput {
    const reports = this.deps.imageCreativeWorker?.getCreativeAssetReports?.() ?? [];
    const match =
      (input.scriptId ? reports.find((r) => r.scriptId === input.scriptId) : null) ??
      (reports.length ? reports[reports.length - 1] : null);
    const creativeIds =
      input.creativeAssetIds ??
      match?.generatedAssets?.map((a) => (typeof a === "string" ? a : a.assetId ?? "")).filter(Boolean) ??
      (match?.creativeAssetId ? [match.creativeAssetId] : null);
    return {
      ...input,
      scriptId: input.scriptId ?? match?.scriptId ?? null,
      channelId: input.channelId ?? match?.channelId ?? null,
      creativeAssetIds: creativeIds,
      creativeAssets:
        input.creativeAssets ??
        match?.generatedAssets?.map((a) =>
          typeof a === "string"
            ? {
                assetId: a,
                assetPath: `assets/generated/${a}.descriptor.json`,
                assetKind: "creative" as const,
              }
            : {
                assetId: a.assetId ?? "creative-unknown",
                assetPath: a.assetPath ?? `assets/generated/${a.assetId ?? "unknown"}.descriptor.json`,
                assetKind: "creative" as const,
                descriptor: a.assetType,
              },
        ) ??
        null,
    };
  }

  enrichInput(input: VideoAssemblyWorkerInput): VideoAssemblyWorkerInput {
    return this.enrichFromImageCreativeWorker(
      this.enrichFromVoiceWorker(this.enrichFromScriptWorker(input)),
    );
  }

  submitReport(reports: VideoAssemblyReport[]): {
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
        details: "no_assembly_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-11",
      currentStatus: "video_assembly_ready",
      progress:
        primary.qualityValidation.status === "pass"
          ? 100
          : primary.qualityValidation.status === "pass_with_notes"
            ? 85
            : 60,
      blockers: reports
        .filter((r) => r.qualityValidation.status === "fail")
        .map((r) => `quality_blocker:${r.assemblyId}:failed`),
      risks: [],
      evidence: [
        `script:${primary.scriptId}`,
        `voice:${primary.voiceAssetId}`,
        `finalVideo:${primary.finalVideoReference.videoId}`,
        ...primary.outputFormats.map((f) => `format:${f.formatId}`),
      ],
      nextAction: "await_publishing_workers_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      assemblyReportCount: reports.length,
      outputFormatCount: primary.outputFormats.length,
      neverPublishedMedia: true,
      neverWroteScripts: true,
      neverGeneratedVoiceovers: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-vaw-${Date.now()}`;
    appendVawLog({
      event: "submit_report",
      details: `assemblyReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: VIDEO_ASSEMBLY_WORKER_IDENTITY.workerName,
      workerType: VIDEO_ASSEMBLY_WORKER_IDENTITY.workerType,
      department: VIDEO_ASSEMBLY_WORKER_IDENTITY.department,
      factory: VIDEO_ASSEMBLY_WORKER_IDENTITY.factory,
      role: VIDEO_ASSEMBLY_WORKER_IDENTITY.role,
      reportingLine: [...VIDEO_ASSEMBLY_WORKER_IDENTITY.reportingLine],
      skillProfile: [...VIDEO_ASSEMBLY_WORKER_IDENTITY.skillProfile],
      approvedTools: [...VIDEO_ASSEMBLY_WORKER_IDENTITY.approvedTools],
      authorityLevel: VIDEO_ASSEMBLY_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-11",
        requiredSkills: [...VIDEO_ASSEMBLY_WORKER_IDENTITY.skillProfile],
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
      case "image_creative_worker":
        return Boolean(this.deps.imageCreativeWorker?.getCreativeAssetReports);
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
    return `Video Assembly Worker ${workerId} ↔ ${target} (${status})`;
  }
}
