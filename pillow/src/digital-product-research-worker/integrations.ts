import { DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY } from "./paths.js";
import type {
  DigitalProductResearchReport,
  DigitalProductResearchWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendDprLog } from "./dpr-logging.js";

/** Optional live workforce integrations for Q5-02 Digital Product Research Worker. */
export type DigitalProductResearchWorkerDependencies = {
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
  digitalProductsFactoryCore?: {
    getLatestMissionId?: () => string | null;
    getMissions?: () => Array<{
      factoryMissionId?: string;
      businessId?: string;
      businessName?: string;
      productType?: string;
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

export type DpfEnrichmentContext = {
  businessId?: string | null;
  factoryMissionId?: string | null;
  productType?: string | null;
  businessName?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: DigitalProductResearchWorkerDependencies = {};

  bind(deps: DigitalProductResearchWorkerDependencies = {}) {
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
      appendDprLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromDigitalProductsFactory(
    input: DigitalProductResearchWorkerInput,
  ): DigitalProductResearchWorkerInput {
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.businessId && m.businessId === input.businessId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);
    return {
      ...input,
      businessId: input.businessId ?? missionMatch?.businessId ?? null,
      factoryMissionId:
        input.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.digitalProductsFactoryCore?.getLatestMissionId?.() ??
        null,
      productType: input.productType ?? missionMatch?.productType ?? null,
      productCategory: input.productCategory ?? missionMatch?.productType ?? null,
      researchTopic:
        input.researchTopic ??
        (missionMatch?.businessName
          ? `Digital product opportunity for ${missionMatch.businessName}`
          : null),
    };
  }

  pullDpfContext(input: DigitalProductResearchWorkerInput): {
    enrichment: DpfEnrichmentContext | null;
  } {
    const enriched = this.enrichFromDigitalProductsFactory(input);
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const missionMatch = missions.find(
      (m) =>
        (enriched.factoryMissionId && m.factoryMissionId === enriched.factoryMissionId) ||
        (enriched.businessId && m.businessId === enriched.businessId),
    );
    const enrichment: DpfEnrichmentContext | null =
      enriched.businessId || enriched.factoryMissionId
        ? {
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            productType: enriched.productType ?? missionMatch?.productType ?? null,
            businessName: missionMatch?.businessName ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(reports: DigitalProductResearchReport[]): {
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
        details: "no_digital_product_research_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-02",
      currentStatus: "digital_product_research_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: reports
        .filter((r) => r.opportunityScore < 40)
        .map((r) => `opportunity_blocker:${r.researchReportId}:low_score`),
      risks: reports
        .filter((r) => r.recommendedPriority === "critical")
        .map((r) => `opportunity_risk:${r.researchReportId}:critical_priority`),
      evidence: primary.supportingEvidence.map((e) => `${e.kind}:${e.source}:${e.claim}`),
      nextAction: "await_pillow_review_of_digital_product_opportunities_no_product_creation",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      researchReportCount: reports.length,
      opportunityScore: primary.opportunityScore,
      recommendedPriority: primary.recommendedPriority,
      neverCreatedDigitalProducts: true,
      neverCreatedSalesPages: true,
      neverProcessedPayments: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-dpr-${Date.now()}`;
    appendDprLog({
      event: "submit_report",
      details: `reports=${reports.length} executive=${executiveReportId}`,
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
      workerName: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.workerName,
      workerType: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.workerType,
      department: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.department,
      factory: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.factory,
      role: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.role,
      reportingLine: [...DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.reportingLine],
      skillProfile: [...DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.skillProfile],
      approvedTools: [...DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.approvedTools],
      authorityLevel: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-02",
        requiredSkills: [...DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.skillProfile],
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
      case "digital_products_factory_core":
        return Boolean(this.deps.digitalProductsFactoryCore?.getMissions);
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
    return `Digital Product Research Worker ${workerId} ↔ ${target} (${status})`;
  }
}
