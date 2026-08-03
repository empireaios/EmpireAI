import { PROMPT_PRODUCT_WORKER_IDENTITY } from "./paths.js";
import type {
  IntegrationHandshake,
  IntegrationTarget,
  PromptProductReport,
  PromptProductWorkerInput,
} from "./types.js";
import { appendPpwLog } from "./ppw-logging.js";

/** Optional live workforce integrations for Q5-04 Prompt Product Worker. */
export type PromptProductWorkerDependencies = {
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
  digitalProductResearchWorker?: {
    getResearchReports?: () => Array<{
      researchReportId?: string;
      opportunityId?: string;
      productCategory?: string;
      targetAudience?: string;
      customerPainPoints?: string[];
      marketGap?: string;
      demandAssessment?: string;
      researchTopic?: string;
      businessId?: string;
      factoryMissionId?: string;
    }>;
    getLatestResearchReportId?: () => string | null;
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

export type DprEnrichmentContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productType?: string | null;
  productTitle?: string | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: PromptProductWorkerDependencies = {};

  bind(deps: PromptProductWorkerDependencies = {}) {
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
      appendPpwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromApprovedResearch(input: PromptProductWorkerInput): PromptProductWorkerInput {
    const reports = this.deps.digitalProductResearchWorker?.getResearchReports?.() ?? [];
    const missions = this.deps.digitalProductsFactoryCore?.getMissions?.() ?? [];
    const researchMatch =
      reports.find((r) => input.researchReportId && r.researchReportId === input.researchReportId) ??
      reports.find((r) => input.opportunityId && r.opportunityId === input.opportunityId) ??
      (reports.length ? reports[reports.length - 1] : null);
    const missionMatch =
      missions.find(
        (m) =>
          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||
          (input.businessId && m.businessId === input.businessId) ||
          (researchMatch?.factoryMissionId &&
            m.factoryMissionId === researchMatch.factoryMissionId) ||
          (researchMatch?.businessId && m.businessId === researchMatch.businessId),
      ) ?? (missions.length ? missions[missions.length - 1] : null);

    const productTitle =
      input.productTitle ??
      researchMatch?.researchTopic ??
      (missionMatch?.businessName
        ? `${missionMatch.businessName} Prompt Pack`
        : null);

    return {
      ...input,
      researchReportId:
        input.researchReportId ??
        researchMatch?.researchReportId ??
        this.deps.digitalProductResearchWorker?.getLatestResearchReportId?.() ??
        null,
      opportunityId: input.opportunityId ?? researchMatch?.opportunityId ?? null,
      businessId:
        input.businessId ?? researchMatch?.businessId ?? missionMatch?.businessId ?? null,
      factoryMissionId:
        input.factoryMissionId ??
        researchMatch?.factoryMissionId ??
        missionMatch?.factoryMissionId ??
        this.deps.digitalProductsFactoryCore?.getLatestMissionId?.() ??
        null,
      productType:
        input.productType ?? researchMatch?.productCategory ?? missionMatch?.productType ?? null,
      productTitle,
      targetAudience: input.targetAudience ?? researchMatch?.targetAudience ?? null,
      customerPainPoints: input.customerPainPoints ?? researchMatch?.customerPainPoints ?? null,
      marketGap: input.marketGap ?? researchMatch?.marketGap ?? null,
      demandAssessment: input.demandAssessment ?? researchMatch?.demandAssessment ?? null,
      researchTopic: input.researchTopic ?? researchMatch?.researchTopic ?? null,
    };
  }

  pullResearchContext(input: PromptProductWorkerInput): {
    enrichment: DprEnrichmentContext | null;
  } {
    const enriched = this.enrichFromApprovedResearch(input);
    const enrichment: DprEnrichmentContext | null =
      enriched.researchReportId || enriched.businessId || enriched.factoryMissionId
        ? {
            researchReportId: enriched.researchReportId ?? null,
            opportunityId: enriched.opportunityId ?? null,
            businessId: enriched.businessId ?? null,
            factoryMissionId: enriched.factoryMissionId ?? null,
            productType: typeof enriched.productType === "string" ? enriched.productType : null,
            productTitle: enriched.productTitle ?? null,
            targetAudience: enriched.targetAudience ?? null,
            customerPainPoints: enriched.customerPainPoints ?? [],
            marketGap: enriched.marketGap ?? null,
            demandAssessment: enriched.demandAssessment ?? null,
            researchTopic: enriched.researchTopic ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(products: PromptProductReport[]): {
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
    const primary = products[products.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_prompt_product_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-04",
      currentStatus: "prompt_product_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: products
        .filter((p) => !p.selfReviewPassed || !p.consistencyValidated)
        .map((p) => `consistency_blocker:${p.promptProductId}`),
      risks: products
        .filter((p) => p.researchCompliance === "non_compliant")
        .map((p) => `research_compliance_risk:${p.promptProductId}`),
      evidence: [
        `product:${primary.productTitle}`,
        `type:${primary.productType}`,
        `prompts:${primary.promptLibrary.length}`,
        `workflows:${primary.workflowComponents.length}`,
        `exports:${primary.exportFormats.join(",")}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction: "await_pillow_review_of_export_ready_prompt_products_no_publish_or_delivery",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      promptProductCount: products.length,
      confidenceScore: primary.confidenceScore,
      neverBuiltSalesPages: true,
      neverProcessedCustomerPayments: true,
      neverDeliveredProducts: true,
      neverPublishedProductsDirectly: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-ppw-${Date.now()}`;
    appendPpwLog({
      event: "submit_report",
      details: `promptProducts=${products.length} executive=${executiveReportId}`,
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
      workerName: PROMPT_PRODUCT_WORKER_IDENTITY.workerName,
      workerType: PROMPT_PRODUCT_WORKER_IDENTITY.workerType,
      department: PROMPT_PRODUCT_WORKER_IDENTITY.department,
      factory: PROMPT_PRODUCT_WORKER_IDENTITY.factory,
      role: PROMPT_PRODUCT_WORKER_IDENTITY.role,
      reportingLine: [...PROMPT_PRODUCT_WORKER_IDENTITY.reportingLine],
      skillProfile: [...PROMPT_PRODUCT_WORKER_IDENTITY.skillProfile],
      approvedTools: [...PROMPT_PRODUCT_WORKER_IDENTITY.approvedTools],
      authorityLevel: PROMPT_PRODUCT_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-04",
        requiredSkills: [...PROMPT_PRODUCT_WORKER_IDENTITY.skillProfile],
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
      case "digital_product_research_worker":
        return Boolean(this.deps.digitalProductResearchWorker?.getResearchReports);
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
    return `Prompt Product Worker ${workerId} ↔ ${target} (${status})`;
  }
}
