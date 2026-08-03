import { SCRIPT_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  ScriptReport,
  ScriptWorkerInput,
} from "./types.js";
import { appendScwLog } from "./scw-logging.js";

/** Optional live workforce integrations for Q4-05 Script Worker. */
export type ScriptWorkerDependencies = {
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
  editorInChiefWorker?: {
    getLatestEditorialReportId?: () => string | null;
    getEditorialReports?: () => Array<{
      editorialReportId?: string;
      channelId?: string;
      mediaBusinessId?: string;
      editorialStrategy?: string;
      channelIdentity?: string;
      targetAudience?: string;
      editorialTone?: string;
      contentPriorities?: string[];
    }>;
  } | null;
  topicPlannerWorker?: {
    getLatestTopicPlanId?: () => string | null;
    getTopicPlans?: () => Array<{
      topicPlanId?: string;
      channelId?: string;
      mediaBusinessId?: string;
      selectedTopics?: Array<{
        topicId?: string;
        title?: string;
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
  private deps: ScriptWorkerDependencies = {};

  bind(deps: ScriptWorkerDependencies = {}) {
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
      appendScwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromUpstreamWorkers(input: ScriptWorkerInput): ScriptWorkerInput {
    const editorialReports = this.deps.editorInChiefWorker?.getEditorialReports?.() ?? [];
    const topicPlans = this.deps.topicPlannerWorker?.getTopicPlans?.() ?? [];
    const channelId = input.channelId ?? null;
    const editorialMatch =
      editorialReports.find((r) => channelId && r.channelId === channelId) ??
      (editorialReports.length ? editorialReports[editorialReports.length - 1] : null);
    const topicPlanMatch =
      topicPlans.find((p) => channelId && p.channelId === channelId) ??
      (topicPlans.length ? topicPlans[topicPlans.length - 1] : null);
    const selectedTopic = topicPlanMatch?.selectedTopics?.[0];
    return {
      ...input,
      channelId: input.channelId ?? editorialMatch?.channelId ?? topicPlanMatch?.channelId ?? null,
      mediaBusinessId:
        input.mediaBusinessId ?? editorialMatch?.mediaBusinessId ?? topicPlanMatch?.mediaBusinessId ?? null,
      topicPlanId:
        input.topicPlanId ??
        topicPlanMatch?.topicPlanId ??
        this.deps.topicPlannerWorker?.getLatestTopicPlanId?.() ??
        null,
      topicId: input.topicId ?? selectedTopic?.topicId ?? null,
      topicTitle: input.topicTitle ?? selectedTopic?.title ?? null,
      editorialStrategy: input.editorialStrategy ?? editorialMatch?.editorialStrategy ?? null,
      channelIdentity: input.channelIdentity ?? editorialMatch?.channelIdentity ?? null,
      targetAudience: input.targetAudience ?? editorialMatch?.targetAudience ?? null,
      editorialTone: input.editorialTone ?? editorialMatch?.editorialTone ?? null,
      contentPriorities: input.contentPriorities ?? editorialMatch?.contentPriorities ?? null,
      editorialReportId:
        input.editorialReportId ??
        editorialMatch?.editorialReportId ??
        this.deps.editorInChiefWorker?.getLatestEditorialReportId?.() ??
        null,
    };
  }

  submitReport(scripts: ScriptReport[]): {
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
    const primary = scripts[scripts.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_scripts_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId,
      missionId: "Q4-05",
      currentStatus: "script_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: scripts
        .filter((s) => !s.selfReviewPassed)
        .map((s) => `self_review_blocker:${s.scriptId}:failed`),
      risks: scripts
        .filter((s) => s.editorialCompliance === "non_compliant")
        .map((s) => `compliance_risk:${s.scriptId}:non_compliant`),
      evidence: primary.scriptSections.map((sec) => `section:${sec.sectionType}:${sec.heading}`),
      nextAction: "await_visual_voiceover_video_workers_no_direct_production",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      scriptCount: scripts.length,
      contentFormat: primary.contentFormat,
      neverGeneratedVisuals: true,
      neverGeneratedVoiceovers: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-scw-${Date.now()}`;
    appendScwLog({
      event: "submit_report",
      details: `scripts=${scripts.length} executive=${executiveReportId}`,
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
      workerName: SCRIPT_WORKER_IDENTITY.workerName,
      workerType: SCRIPT_WORKER_IDENTITY.workerType,
      department: SCRIPT_WORKER_IDENTITY.department,
      factory: SCRIPT_WORKER_IDENTITY.factory,
      role: SCRIPT_WORKER_IDENTITY.role,
      reportingLine: [...SCRIPT_WORKER_IDENTITY.reportingLine],
      skillProfile: [...SCRIPT_WORKER_IDENTITY.skillProfile],
      approvedTools: [...SCRIPT_WORKER_IDENTITY.approvedTools],
      authorityLevel: SCRIPT_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-05",
        requiredSkills: [...SCRIPT_WORKER_IDENTITY.skillProfile],
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
      case "editor_in_chief_worker":
        return Boolean(this.deps.editorInChiefWorker?.getEditorialReports);
      case "topic_planner_worker":
        return Boolean(this.deps.topicPlannerWorker?.getTopicPlans);
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
    return `Script Worker ${workerId} ↔ ${target} (${status})`;
  }
}
