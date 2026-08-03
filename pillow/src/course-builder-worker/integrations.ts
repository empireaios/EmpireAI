import { COURSE_BUILDER_WORKER_IDENTITY } from "./paths.js";
import type {
  CourseBuilderReport,
  CourseBuilderWorkerInput,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";
import { appendCbwLog } from "./cbw-logging.js";

/** Optional live workforce integrations for Q5-05 Course Builder Worker. */
export type CourseBuilderWorkerDependencies = {
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
  private deps: CourseBuilderWorkerDependencies = {};

  bind(deps: CourseBuilderWorkerDependencies = {}) {
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
      appendCbwLog({
        event: "integration_handshake",
        details: `${target}:${status}`,
      });
    }
    this.handshakes = resolved;
    this.provisionWorkerIdentity(workerId);
    return this.getHandshakes();
  }

  enrichFromApprovedResearch(input: CourseBuilderWorkerInput): CourseBuilderWorkerInput {
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
      input.courseTitle ??
      researchMatch?.researchTopic ??
      (missionMatch?.businessName
        ? `${missionMatch.businessName} Course`
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
      courseTitle: input.courseTitle ?? productTitle,
      targetAudience: input.targetAudience ?? researchMatch?.targetAudience ?? null,
      customerPainPoints: input.customerPainPoints ?? researchMatch?.customerPainPoints ?? null,
      marketGap: input.marketGap ?? researchMatch?.marketGap ?? null,
      demandAssessment: input.demandAssessment ?? researchMatch?.demandAssessment ?? null,
      researchTopic: input.researchTopic ?? researchMatch?.researchTopic ?? null,
    };
  }

  pullResearchContext(input: CourseBuilderWorkerInput): {
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
            productTitle: enriched.productTitle ?? enriched.courseTitle ?? null,
            targetAudience: enriched.targetAudience ?? null,
            customerPainPoints: enriched.customerPainPoints ?? [],
            marketGap: enriched.marketGap ?? null,
            demandAssessment: enriched.demandAssessment ?? null,
            researchTopic: enriched.researchTopic ?? null,
          }
        : null;
    return { enrichment };
  }

  submitReport(courses: CourseBuilderReport[]): {
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
    const primary = courses[courses.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_course_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: primary.workerId,
      entityType: "worker",
      businessId: primary.businessId,
      missionId: "Q5-05",
      currentStatus: "course_builder_report_prepared",
      progress: Math.round(primary.confidenceScore),
      blockers: courses
        .filter((c) => !c.selfReviewPassed)
        .map((c) => `self_review_blocker:${c.courseId}`),
      risks: courses
        .filter((c) => c.researchCompliance === "non_compliant")
        .map((c) => `research_compliance_risk:${c.courseId}`),
      evidence: [
        `course:${primary.courseTitle}`,
        `type:${primary.productType}`,
        `lessons:${primary.lessonCount}`,
        `quizzes:${primary.quizCount}`,
        `resources:${primary.resourceCount}`,
        `exports:${primary.exportFormats.join(",")}`,
        `quality:${primary.qualityReview.slice(0, 120)}`,
      ],
      nextAction: "await_pillow_review_of_export_ready_course_assets_no_publish_or_delivery",
      completionStatus: "completed",
      reportType: "worker",
      validated: true,
      courseCount: courses.length,
      confidenceScore: primary.confidenceScore,
      neverBuiltSalesPages: true,
      neverProcessedPayments: true,
      neverDeliveredCoursesToCustomers: true,
      neverPublishedCoursesDirectly: true,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-cbw-${Date.now()}`;
    appendCbwLog({
      event: "submit_report",
      details: `courses=${courses.length} executive=${executiveReportId}`,
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
      workerName: COURSE_BUILDER_WORKER_IDENTITY.workerName,
      workerType: COURSE_BUILDER_WORKER_IDENTITY.workerType,
      department: COURSE_BUILDER_WORKER_IDENTITY.department,
      factory: COURSE_BUILDER_WORKER_IDENTITY.factory,
      role: COURSE_BUILDER_WORKER_IDENTITY.role,
      reportingLine: [...COURSE_BUILDER_WORKER_IDENTITY.reportingLine],
      skillProfile: [...COURSE_BUILDER_WORKER_IDENTITY.skillProfile],
      approvedTools: [...COURSE_BUILDER_WORKER_IDENTITY.approvedTools],
      authorityLevel: COURSE_BUILDER_WORKER_IDENTITY.authorityLevel,
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
        missionId: "Q5-05",
        requiredSkills: [...COURSE_BUILDER_WORKER_IDENTITY.skillProfile],
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
    return `Course Builder Worker ${workerId} ↔ ${target} (${status})`;
  }
}
