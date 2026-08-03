import { LOCAL_MARKET_RESEARCH_WORKER_IDENTITY } from "./paths.js";
import { appendLmrwLog } from "./lmrw-logging.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  LocalMarketResearchReport,
  ResearchFixturePayload,
} from "./types.js";

/** Optional live workforce integrations for Q7-02 Local Market Research Worker. */
export type LocalMarketResearchWorkerDependencies = {
  localBusinessFactoryCore?: {
    getProjects?: () => Array<{
      businessProjectId?: string;
      businessCategory?: string;
      businessName?: string;
    }>;
    getLatestProjectId?: () => string | null;
  } | null;
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
  /** Soft optional — only used when present; never invents a runtime. */
  researchFixtureProvider?: {
    getFixture?: (input: Record<string, unknown>) => ResearchFixturePayload | null;
  } | null;
  memoryRuntime?: {
    remember?: (input: Record<string, unknown>) => unknown;
  } | null;
  apiIntegrationRuntime?: {
    request?: (input: Record<string, unknown>) => unknown;
  } | null;
  toolRuntime?: {
    invoke?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: LocalMarketResearchWorkerDependencies = {};

  bind(deps: LocalMarketResearchWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
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
      appendLmrwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  resolveExternalFixture(input: Record<string, unknown>): ResearchFixturePayload | null {
    try {
      const fixture = this.deps.researchFixtureProvider?.getFixture?.(input) ?? null;
      return fixture;
    } catch {
      return null;
    }
  }

  submitReport(report: LocalMarketResearchReport): {
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
      reportingEntity: report.workerId,
      entityType: "worker",
      businessId: report.businessProjectId,
      missionId: "Q7-02",
      currentStatus: "local_market_research_complete",
      progress: Math.round(report.confidenceScore * 100),
      blockers: report.unknowns,
      risks: report.risks,
      evidence: report.evidenceSources.map(
        (e) => `${e.evidenceClass}:${e.evidenceMode}:${e.sourceReference}:${e.claim}`,
      ),
      nextAction: report.recommendedResearchFollowUps[0] ?? "await_q7_03_service_offer_worker",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      localMarketResearchReport: report,
      neverFinalizeServicePackages: true,
      neverSetFinalPrices: true,
      neverMakeLaunchDecisions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-lmrw-${Date.now()}`;
    appendLmrwLog({
      event: "submit_report",
      details: `report=${report.researchId} executive=${executiveReportId}`,
    });
    try {
      this.deps.memoryRuntime?.remember?.({
        kind: "local_market_research_report",
        researchId: report.researchId,
        businessProjectId: report.businessProjectId,
      });
    } catch {
      /* memory soft-optional */
    }
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }

  private provisionWorkerIdentity(workerId: string) {
    const identity = {
      workerId,
      workerName: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.workerName,
      workerType: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.workerType,
      department: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.department,
      factory: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.factory,
      role: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.role,
      reportingLine: [...LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.reportingLine],
      skillProfile: [...LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.skillProfile],
      approvedTools: [...LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.approvedTools],
      authorityLevel: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q7-02",
        requiredSkills: [...LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.skillProfile],
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
      case "local_business_factory_core":
        return !!this.deps.localBusinessFactoryCore;
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
    return `${target} integration ${status} for ${workerId}; local market research-only worker under Pillow.`;
  }
}
