import { VOICE_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  VoiceReport,
  VoiceWorkerInput,
} from "./types.js";
import { appendVowLog } from "./vow-logging.js";

/** Optional live workforce integrations for Q4-10 Voice Worker. */
export type VoiceWorkerDependencies = {
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
  private deps: VoiceWorkerDependencies = {};

  bind(deps: VoiceWorkerDependencies = {}) {
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
      appendVowLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromScriptWorker(input: VoiceWorkerInput): VoiceWorkerInput {
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

  enrichInput(input: VoiceWorkerInput): VoiceWorkerInput {
    return this.enrichFromScriptWorker(input);
  }

  submitReport(reports: VoiceReport[]): {
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
        details: "no_voice_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.channelId,
      missionId: "Q4-10",
      currentStatus: "voiceovers_ready",
      progress: primary.qualityStatus === "pass" ? 100 : primary.qualityStatus === "pass_with_notes" ? 85 : 60,
      blockers: reports
        .filter((r) => r.qualityStatus === "fail")
        .map((r) => `quality_blocker:${r.voiceReportId}:failed`),
      risks: [],
      evidence: [
        `voiceProfile:${primary.voiceProfile}`,
        `language:${primary.language}`,
        ...primary.voiceAssetReferences.map((a) => `voiceAsset:${a.assetId}`),
        ...primary.variants.map((v) => `variant:${v.variantId}`),
      ],
      nextAction: "await_video_assembly_workers_no_direct_publish",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      voiceReportCount: reports.length,
      variantCount: primary.variantCount,
      confidenceScore: primary.confidenceScore,
      neverAssembledVideos: true,
      neverPublishedMedia: true,
      neverRewroteScripts: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-vow-${Date.now()}`;
    appendVowLog({
      event: "submit_report",
      details: `voiceReports=${reports.length} executive=${executiveReportId}`,
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
      workerName: VOICE_WORKER_IDENTITY.workerName,
      workerType: VOICE_WORKER_IDENTITY.workerType,
      department: VOICE_WORKER_IDENTITY.department,
      factory: VOICE_WORKER_IDENTITY.factory,
      role: VOICE_WORKER_IDENTITY.role,
      reportingLine: [...VOICE_WORKER_IDENTITY.reportingLine],
      skillProfile: [...VOICE_WORKER_IDENTITY.skillProfile],
      approvedTools: [...VOICE_WORKER_IDENTITY.approvedTools],
      authorityLevel: VOICE_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-10",
        requiredSkills: [...VOICE_WORKER_IDENTITY.skillProfile],
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
    return `Voice Worker ${workerId} ↔ ${target} (${status})`;
  }
}
