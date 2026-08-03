import { TOPIC_PLANNER_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  TopicPlan,
  TopicPlannerWorkerInput,
} from "./types.js";
import { appendTpwLog } from "./tpw-logging.js";

/** Optional live workforce integrations for Q4-04 Topic Planner Worker. */
export type TopicPlannerWorkerDependencies = {
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
  trendResearchWorker?: {
    getLatestTrendReportId?: () => string | null;
    getTrendReports?: () => Array<{
      trendReportId?: string;
      channelId?: string;
      trendTopic?: string;
      confidenceScore?: number;
      recommendedPriority?: string;
      trendDirection?: string;
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
  private deps: TopicPlannerWorkerDependencies = {};

  bind(deps: TopicPlannerWorkerDependencies = {}) {
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
      appendTpwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromUpstreamWorkers(input: TopicPlannerWorkerInput): TopicPlannerWorkerInput {
    const editorialReports = this.deps.editorInChiefWorker?.getEditorialReports?.() ?? [];
    const trendReports = this.deps.trendResearchWorker?.getTrendReports?.() ?? [];
    const channelId = input.channelId ?? null;
    const editorialMatch =
      editorialReports.find((r) => channelId && r.channelId === channelId) ??
      (editorialReports.length ? editorialReports[editorialReports.length - 1] : null);
    const trendMatches = trendReports.filter(
      (r) => !channelId || r.channelId === channelId,
    );
    const compactTrends = (input.trendReports ?? []).length
      ? input.trendReports
      : trendMatches.map((r) => ({
          trendReportId: r.trendReportId,
          trendTopic: r.trendTopic,
          confidenceScore: r.confidenceScore,
          recommendedPriority: r.recommendedPriority,
          trendDirection: r.trendDirection,
        }));
    return {
      ...input,
      channelId: input.channelId ?? editorialMatch?.channelId ?? trendMatches[0]?.channelId ?? null,
      mediaBusinessId: input.mediaBusinessId ?? null,
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
      trendReports: compactTrends ?? null,
    };
  }

  submitPlan(plans: TopicPlan[]): {
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
    const primary = plans[plans.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_topic_plans_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.mediaBusinessId,
      missionId: "Q4-04",
      currentStatus: "topic_plan_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: plans
        .filter((p) => p.cadenceStatus === "behind")
        .map((p) => `cadence_blocker:${p.topicPlanId}:behind`),
      risks: plans
        .filter((p) => p.topicPriority === "critical")
        .map((p) => `topic_risk:${p.topicPlanId}:critical_priority`),
      evidence: primary.selectedTopics.map((t) => `topic:${t.title}:${t.contentMix}`),
      nextAction: "await_content_production_workers_no_direct_content_creation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      topicPlanCount: plans.length,
      topicPriority: primary.topicPriority,
      cadenceStatus: primary.cadenceStatus,
      neverPublishedContent: true,
      neverWroteScripts: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-tpw-${Date.now()}`;
    appendTpwLog({
      event: "submit_plan",
      details: `plans=${plans.length} executive=${executiveReportId}`,
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
      workerName: TOPIC_PLANNER_WORKER_IDENTITY.workerName,
      workerType: TOPIC_PLANNER_WORKER_IDENTITY.workerType,
      department: TOPIC_PLANNER_WORKER_IDENTITY.department,
      factory: TOPIC_PLANNER_WORKER_IDENTITY.factory,
      role: TOPIC_PLANNER_WORKER_IDENTITY.role,
      reportingLine: [...TOPIC_PLANNER_WORKER_IDENTITY.reportingLine],
      skillProfile: [...TOPIC_PLANNER_WORKER_IDENTITY.skillProfile],
      approvedTools: [...TOPIC_PLANNER_WORKER_IDENTITY.approvedTools],
      authorityLevel: TOPIC_PLANNER_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q4-04",
        requiredSkills: [...TOPIC_PLANNER_WORKER_IDENTITY.skillProfile],
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
      case "trend_research_worker":
        return Boolean(this.deps.trendResearchWorker?.getTrendReports);
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
    return `Topic Planner Worker ${workerId} ↔ ${target} (${status})`;
  }
}
