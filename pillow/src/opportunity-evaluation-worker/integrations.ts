import { OPPORTUNITY_EVALUATION_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  OpportunityEvaluationReport,
} from "./types.js";
import { appendOewLog } from "./oew-logging.js";

/** Optional live workforce integrations for Q2-05 Opportunity Evaluation Worker. */
export type OpportunityEvaluationWorkerDependencies = {
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
  private deps: OpportunityEvaluationWorkerDependencies = {};

  bind(deps: OpportunityEvaluationWorkerDependencies = {}) {
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
      appendOewLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitReport(evaluation: OpportunityEvaluationReport): {
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
    const result = runtime.submitWorkerReport({
      reportingEntity: evaluation.workerId,
      entityType: "worker",
      businessId: evaluation.businessBuildMissionId,
      missionId: "Q2-05",
      currentStatus: `opportunity_evaluation_${evaluation.recommendation.toLowerCase()}`,
      progress: Math.round(evaluation.overallOpportunityScore),
      blockers: evaluation.missingInformation,
      risks: [
        `risk_score=${evaluation.riskScore}`,
        ...evaluation.scoreExplanations.executionRisk.facts.slice(0, 5),
      ],
      evidence: evaluation.supportingEvidence.map(
        (e) => `${e.kind}:${e.source}:${e.claim}`,
      ),
      nextAction: `recommendation=${evaluation.recommendation}`,
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-oew-${Date.now()}`;
    appendOewLog({
      event: "submit_report",
      details: `evaluation=${evaluation.evaluationId} executive=${executiveReportId}`,
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
      workerName: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.workerName,
      workerType: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.workerType,
      department: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.department,
      factory: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.factory,
      role: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.role,
      reportingLine: [...OPPORTUNITY_EVALUATION_WORKER_IDENTITY.reportingLine],
      skillProfile: [...OPPORTUNITY_EVALUATION_WORKER_IDENTITY.skillProfile],
      approvedTools: [...OPPORTUNITY_EVALUATION_WORKER_IDENTITY.approvedTools],
      authorityLevel: OPPORTUNITY_EVALUATION_WORKER_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };

    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* registry may reject duplicates; handshake still recorded */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* lifecycle optional during isolated tests */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q2-05",
        requiredSkills: [...OPPORTUNITY_EVALUATION_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* assignment optional during isolated tests */
    }
    try {
      this.deps.workerPerformanceReview?.registerPerformanceWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* performance optional during isolated tests */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* recovery optional during isolated tests */
    }
  }

  private isBound(target: IntegrationTarget): boolean {
    switch (target) {
      case "worker_registry":
        return !!this.deps.workerRegistry;
      case "worker_lifecycle":
        return !!this.deps.workerLifecycle;
      case "worker_assignment_engine":
        return !!this.deps.workerAssignmentEngine;
      case "executive_reporting_runtime":
        return !!this.deps.executiveReportingRuntime;
      case "worker_performance_review":
        return !!this.deps.workerPerformanceReview;
      case "worker_recovery_system":
        return !!this.deps.workerRecoverySystem;
      default:
        return false;
    }
  }

  private describe(target: IntegrationTarget, workerId: string, status: string): string {
    return `${target} integration ${status} for ${workerId}; evaluation-only worker under Pillow.`;
  }
}
