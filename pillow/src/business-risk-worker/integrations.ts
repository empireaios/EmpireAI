import { BUSINESS_RISK_WORKER_IDENTITY } from "./paths.js";
import type {
  BusinessRiskReport,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendBrwLog } from "./brw-logging.js";

/** Optional live workforce / coordination integrations for Q2-08 Business Risk Worker. */
export type BusinessRiskWorkerDependencies = {
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
  businessBlueprintWorker?: {
    getLatestBlueprintId?: () => string | null;
    getBlueprints?: () => unknown[];
  } | null;
  launchPlanWorker?: {
    getLatestLaunchPlanId?: () => string | null;
    getLaunchPlans?: () => unknown[];
  } | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
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
  private deps: BusinessRiskWorkerDependencies = {};

  bind(deps: BusinessRiskWorkerDependencies = {}) {
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
      appendBrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  submitRiskReport(report: BusinessRiskReport): {
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

    const topRisks = report.risks
      .filter((r) => r.overallRiskRating === "critical" || r.overallRiskRating === "high")
      .slice(0, 8)
      .map((r) => `${r.riskCategory}:${r.overallRiskRating}:${r.riskDescription}`);

    const result = runtime.submitWorkerReport({
      reportingEntity: report.workerId,
      entityType: "worker",
      businessId: report.businessBuildMissionId,
      missionId: "Q2-08",
      currentStatus: "business_risk_assessment_ready",
      progress: 100,
      blockers: report.missingInformation.slice(0, 10),
      risks: topRisks,
      evidence: [
        ...report.traceabilityRefs,
        `portfolio_rating=${report.overallPortfolioRiskRating}`,
        `risk_count=${report.risks.length}`,
        `high_or_critical=${report.highOrCriticalCount}`,
      ],
      nextAction: "await_executive_review_of_business_risk_report",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
    });

    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-brw-${Date.now()}`;
    appendBrwLog({
      event: "submit_risk_report",
      details: `report=${report.riskReportId} executive=${executiveReportId}`,
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
      workerName: BUSINESS_RISK_WORKER_IDENTITY.workerName,
      workerType: BUSINESS_RISK_WORKER_IDENTITY.workerType,
      department: BUSINESS_RISK_WORKER_IDENTITY.department,
      factory: BUSINESS_RISK_WORKER_IDENTITY.factory,
      role: BUSINESS_RISK_WORKER_IDENTITY.role,
      reportingLine: [...BUSINESS_RISK_WORKER_IDENTITY.reportingLine],
      skillProfile: [...BUSINESS_RISK_WORKER_IDENTITY.skillProfile],
      approvedTools: [...BUSINESS_RISK_WORKER_IDENTITY.approvedTools],
      authorityLevel: BUSINESS_RISK_WORKER_IDENTITY.authorityLevel,
      certificationStatus: "certified",
      operationalStatus: "active",
      validated: true,
    };

    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* optional */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId, validated: true });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerAssignmentEngine?.discoverEligibleWorkers?.({
        missionId: "Q2-08",
        requiredSkills: [...BUSINESS_RISK_WORKER_IDENTITY.skillProfile],
        validated: true,
      });
    } catch {
      /* optional — discover only, never assign */
    }
    try {
      this.deps.workerPerformanceReview?.registerPerformanceWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.({
        workerId,
        validated: true,
      });
    } catch {
      /* optional */
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
      case "business_blueprint_worker":
        return !!this.deps.businessBlueprintWorker;
      case "launch_plan_worker":
        return !!this.deps.launchPlanWorker;
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
    return `${target} integration ${status} for ${workerId}; assessment-only business risk worker under Pillow.`;
  }
}
