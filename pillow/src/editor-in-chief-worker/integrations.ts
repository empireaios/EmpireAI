import { EDITOR_IN_CHIEF_WORKER_IDENTITY } from "./paths.js";

import type {

  EditorialReport,

  EditorInChiefWorkerInput,

  IntegrationHandshake,

  IntegrationTarget,

} from "./types.js";

import { appendEcwLog } from "./ecw-logging.js";



/** Optional live workforce integrations for Q4-02 Editor-in-Chief Worker. */

export type EditorInChiefWorkerDependencies = {

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

  mediaFactoryCore?: {

    getLatestMissionId?: () => string | null;

    getMissions?: () => Array<{

      mediaMissionId?: string | null;

      mediaBusinessId?: string | null;

      channelId?: string | null;

      channelName?: string | null;

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

  private deps: EditorInChiefWorkerDependencies = {};



  bind(deps: EditorInChiefWorkerDependencies = {}) {

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

      appendEcwLog({

        event: "integration_handshake",

        details: `${target}:${status}`,

      });

    }

    this.handshakes = resolved;

    this.provisionWorkerIdentity(workerId);

    return this.getHandshakes();

  }



  enrichFromMediaFactory(input: EditorInChiefWorkerInput): EditorInChiefWorkerInput {

    const missions = this.deps.mediaFactoryCore?.getMissions?.() ?? [];

    const latestMissionId = this.deps.mediaFactoryCore?.getLatestMissionId?.() ?? null;



    const channelId = input.channelId ?? null;

    const mediaMissionId = input.mediaMissionId ?? latestMissionId ?? null;



    const missionMatch =

      missions.find(

        (m) =>

          (mediaMissionId && m.mediaMissionId === mediaMissionId) ||

          (channelId && m.channelId === channelId),

      ) ?? (missions.length ? missions[missions.length - 1] : null);



    return {

      ...input,

      mediaBusinessId:

        input.mediaBusinessId ?? missionMatch?.mediaBusinessId ?? null,

      channelId: input.channelId ?? missionMatch?.channelId ?? null,

      channelName: input.channelName ?? missionMatch?.channelName ?? null,

      mediaMissionId:

        input.mediaMissionId ?? missionMatch?.mediaMissionId ?? latestMissionId ?? null,

    };

  }



  submitReport(reports: EditorialReport[]): {

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

        details: "no_editorial_reports_to_submit",

      };

    }

    const result = runtime.submitWorkerReport({

      reportingEntity: primary.workerId,

      entityType: "worker",

      businessId: primary.mediaBusinessId,

      missionId: "Q4-02",

      currentStatus: "editorial_report_prepared",

      progress:

        primary.reviewOutcome === "approved"

          ? 100

          : primary.reviewOutcome === "revise"

            ? 60

            : 40,

      blockers: reports

        .filter((r) => r.reviewOutcome === "rejected" || r.reviewOutcome === "blocked_boundary")

        .map((r) => `editorial_blocker:${r.editorialReportId}:${r.reviewOutcome}`),

      risks: reports

        .filter((r) => r.brandConsistencyStatus === "inconsistent")

        .map((r) => `editorial_risk:${r.editorialReportId}:brand_inconsistent`),

      evidence: primary.traceabilityRefs,

      nextAction:

        "await_pillow_review_of_editorial_recommendations_no_production_or_publishing",

      completionStatus: "completed",

      reportType: "worker",

      validated: true,

      editorialReportCount: reports.length,

      reviewOutcome: primary.reviewOutcome,

      approvalStatus: primary.approvalStatus,

      neverWroteScripts: true,

      neverPublishedContent: true,

    });

    const executiveReportId =

      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-ecw-${Date.now()}`;

    appendEcwLog({

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

      workerName: EDITOR_IN_CHIEF_WORKER_IDENTITY.workerName,

      workerType: EDITOR_IN_CHIEF_WORKER_IDENTITY.workerType,

      department: EDITOR_IN_CHIEF_WORKER_IDENTITY.department,

      factory: EDITOR_IN_CHIEF_WORKER_IDENTITY.factory,

      role: EDITOR_IN_CHIEF_WORKER_IDENTITY.role,

      reportingLine: [...EDITOR_IN_CHIEF_WORKER_IDENTITY.reportingLine],

      skillProfile: [...EDITOR_IN_CHIEF_WORKER_IDENTITY.skillProfile],

      approvedTools: [...EDITOR_IN_CHIEF_WORKER_IDENTITY.approvedTools],

      authorityLevel: EDITOR_IN_CHIEF_WORKER_IDENTITY.authorityLevel,

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

        missionId: "Q4-02",

        requiredSkills: [...EDITOR_IN_CHIEF_WORKER_IDENTITY.skillProfile],

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

      case "media_factory_core":

        return Boolean(

          this.deps.mediaFactoryCore?.getLatestMissionId ||

            this.deps.mediaFactoryCore?.getMissions,

        );

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

    return `Editor-in-Chief Worker ${workerId} ↔ ${target} (${status})`;

  }

}


