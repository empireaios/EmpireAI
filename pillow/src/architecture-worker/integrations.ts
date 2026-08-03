import { ARCHITECTURE_WORKER_IDENTITY } from "./paths.js";

import { appendArwLog } from "./arw-logging.js";

import type {

  ArchitectureReport,

  ArchitectureWorkerInput,

  IntegrationHandshake,

  IntegrationTarget,

} from "./types.js";



/** Optional live workforce integrations for Q6-03 Architecture Worker. */

export type ArchitectureWorkerDependencies = {

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

  enterprisePlatformFactoryCore?: {

    getMissions?: () => Array<{

      factoryMissionId?: string;

      platformId?: string;

      platformName?: string;

      businessId?: string;

      businessObjective?: string;

    }>;

    getLatestMissionId?: () => string | null;

  } | null;

  requirementsWorker?: {

    getRequirementsReports?: () => Array<{

      requirementsId?: string;

      platformId?: string;

      platformName?: string;

      businessObjective?: string;

      factoryMissionId?: string;

      businessId?: string;

      functionalRequirements?: Array<{ id?: string; statement?: string }>;

      userStories?: Array<{ id?: string; asA?: string; iWant?: string; soThat?: string }>;

    }>;

    getLatestRequirementsReportId?: () => string | null;

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



export type EnrichmentContext = {

  platformId?: string | null;

  platformName?: string | null;

  businessId?: string | null;

  factoryMissionId?: string | null;

  businessObjective?: string | null;

  requirementsReportId?: string | null;

  functionalRequirements?: Array<{ id?: string; statement?: string }>;

  userStories?: Array<{ id?: string; asA?: string; iWant?: string; soThat?: string }>;

};



export class IntegrationCoordinator {

  private handshakes: IntegrationHandshake[] = [];

  private deps: ArchitectureWorkerDependencies = {};



  bind(deps: ArchitectureWorkerDependencies = {}) {

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

      appendArwLog({

        event: "integration_handshake",

        details: `${target}:${status}`,

      });

    }

    this.handshakes = resolved;

    this.provisionWorkerIdentity(workerId);

    return this.getHandshakes();

  }



  enrichFromApprovedRequirements(input: ArchitectureWorkerInput): ArchitectureWorkerInput {

    const epfcEnriched = this.enrichFromEnterprisePlatformFactoryCore(input);

    const reqReports = this.deps.requirementsWorker?.getRequirementsReports?.() ?? [];

    const reqMatch =

      reqReports.find(

        (r) =>

          (input.requirementsReportId && r.requirementsId === input.requirementsReportId) ||

          (input.platformId && r.platformId === input.platformId) ||

          (input.businessId && r.businessId === input.businessId),

      ) ?? (reqReports.length ? reqReports[reqReports.length - 1] : null);



    return {

      ...epfcEnriched,

      requirementsReportId:

        input.requirementsReportId ??

        reqMatch?.requirementsId ??

        this.deps.requirementsWorker?.getLatestRequirementsReportId?.() ??

        null,

      platformId: epfcEnriched.platformId ?? reqMatch?.platformId ?? null,

      platformName: epfcEnriched.platformName ?? reqMatch?.platformName ?? null,

      businessId: epfcEnriched.businessId ?? reqMatch?.businessId ?? null,

      factoryMissionId: epfcEnriched.factoryMissionId ?? reqMatch?.factoryMissionId ?? null,

      businessObjective: epfcEnriched.businessObjective ?? reqMatch?.businessObjective ?? null,

    };

  }



  enrichFromEnterprisePlatformFactoryCore(

    input: ArchitectureWorkerInput,

  ): ArchitectureWorkerInput {

    const missions = this.deps.enterprisePlatformFactoryCore?.getMissions?.() ?? [];

    const missionMatch =

      missions.find(

        (m) =>

          (input.factoryMissionId && m.factoryMissionId === input.factoryMissionId) ||

          (input.platformId && m.platformId === input.platformId) ||

          (input.businessId && m.businessId === input.businessId),

      ) ?? (missions.length ? missions[missions.length - 1] : null);



    return {

      ...input,

      platformId: input.platformId ?? missionMatch?.platformId ?? null,

      platformName: input.platformName ?? missionMatch?.platformName ?? null,

      businessId: input.businessId ?? missionMatch?.businessId ?? null,

      factoryMissionId:

        input.factoryMissionId ??

        missionMatch?.factoryMissionId ??

        this.deps.enterprisePlatformFactoryCore?.getLatestMissionId?.() ??

        null,

      businessObjective: input.businessObjective ?? missionMatch?.businessObjective ?? null,

    };

  }



  pullRequirementsContext(input: ArchitectureWorkerInput): {

    enrichment: EnrichmentContext | null;

  } {

    const enriched = this.enrichFromApprovedRequirements(input);

    const reqReports = this.deps.requirementsWorker?.getRequirementsReports?.() ?? [];

    const reqMatch = reqReports.find(

      (r) => r.requirementsId === enriched.requirementsReportId,

    );



    const enrichment: EnrichmentContext | null =

      enriched.platformId ||

      enriched.platformName ||

      enriched.businessId ||

      enriched.factoryMissionId ||

      enriched.businessObjective ||

      enriched.requirementsReportId

        ? {

            platformId: enriched.platformId ?? null,

            platformName: enriched.platformName ?? null,

            businessId: enriched.businessId ?? null,

            factoryMissionId: enriched.factoryMissionId ?? null,

            businessObjective: enriched.businessObjective ?? null,

            requirementsReportId: enriched.requirementsReportId ?? null,

            functionalRequirements: reqMatch?.functionalRequirements ?? [],

            userStories: reqMatch?.userStories ?? [],

          }

        : null;

    return { enrichment };

  }



  submitReport(reports: ArchitectureReport[]): {

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

        details: "no_architecture_reports_to_submit",

      };

    }

    const result = runtime.submitWorkerReport({

      reportingEntity: primary.workerId,

      entityType: "worker",

      businessId: primary.businessId,

      missionId: "Q6-03",

      currentStatus: "architecture_worker_report_prepared",

      progress: Math.round(primary.confidenceScore),

      blockers: reports

        .filter((r) => !r.selfReviewPassed)

        .map((r) => `self_review_blocker:${r.architectureId}`),

      risks: reports

        .filter((r) => r.architecturalCompliance === "non_compliant")

        .map((r) => `architectural_compliance_risk:${r.architectureId}`),

      evidence: [

        `platform:${primary.platformName}`,

        `requirements:${primary.requirementsReportId}`,

        `modules:${primary.moduleArchitecture.length}`,

        `quality:${primary.qualityReview.slice(0, 120)}`,

      ],

      nextAction: "await_pillow_review_of_architecture_no_code_or_deployment",

      completionStatus: "completed",

      reportType: "worker",

      validated: true,

      architectureReportCount: reports.length,

      confidenceScore: primary.confidenceScore,

      neverWroteFrontendCode: true,

      neverWroteBackendCode: true,

      neverDeployedApplications: true,

    });

    const executiveReportId =

      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-arw-${Date.now()}`;

    appendArwLog({

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

      workerName: ARCHITECTURE_WORKER_IDENTITY.workerName,

      workerType: ARCHITECTURE_WORKER_IDENTITY.workerType,

      department: ARCHITECTURE_WORKER_IDENTITY.department,

      factory: ARCHITECTURE_WORKER_IDENTITY.factory,

      role: ARCHITECTURE_WORKER_IDENTITY.role,

      reportingLine: [...ARCHITECTURE_WORKER_IDENTITY.reportingLine],

      skillProfile: [...ARCHITECTURE_WORKER_IDENTITY.skillProfile],

      approvedTools: [...ARCHITECTURE_WORKER_IDENTITY.approvedTools],

      authorityLevel: ARCHITECTURE_WORKER_IDENTITY.authorityLevel,

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

        missionId: "Q6-03",

        requiredSkills: [...ARCHITECTURE_WORKER_IDENTITY.skillProfile],

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

      case "enterprise_platform_factory_core":

        return Boolean(this.deps.enterprisePlatformFactoryCore?.getMissions);

      case "requirements_worker":

        return Boolean(this.deps.requirementsWorker?.getRequirementsReports);

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

    return `Architecture Worker ${workerId} ↔ ${target} (${status})`;

  }

}


