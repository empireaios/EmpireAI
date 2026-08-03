import type { LocalBusinessFactoryCoreConfiguration } from "./configuration.js";
import {
  LBFC_METADATA_VERSION,
  LIFECYCLE_STAGES,
  LOCAL_BUSINESS_FACTORY_CORE_IDENTITY,
  LOCAL_BUSINESS_FACTORY_CORE_ID,
  LOCAL_BUSINESS_FACTORY_REPORT_VERSION,
  LOCAL_BUSINESS_MISSION_VERSION,
} from "./paths.js";
import type {
  ApprovalStatus,
  BusinessCategory,
  CustomerAcquisitionStatus,
  IntegrationHandshake,
  LaunchReadinessStatus,
  LifecycleStage,
  LocalBusinessFactoryCoreCatalog,
  LocalBusinessFactoryCoreInput,
  LocalBusinessFactoryReport,
  LocalBusinessProject,
  MissionStatus,
  OperationalStatus,
} from "./types.js";

/** Pure Local Business Factory Core helpers for Q7-01 — orchestration only. */
export class MissionBuilder {
  buildCatalog(
    config: LocalBusinessFactoryCoreConfiguration,
    projects: LocalBusinessProject[],
    reports: LocalBusinessFactoryReport[],
    integrations: IntegrationHandshake[],
  ): LocalBusinessFactoryCoreCatalog {
    return {
      missionVersion: LOCAL_BUSINESS_MISSION_VERSION,
      reportVersion: LOCAL_BUSINESS_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      businessCategories: [...config.businessCategories],
      lifecycleStages: [...config.lifecycleStages],
      projects: projects.map(cloneProject),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LBFC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPerformSpecialistWorkerFunctions: true,
      neverReplaceQ7Workers: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateOperationalStatus: true,
      neverImplementQ702OrLater: true,
    };
  }

  buildProject(
    input: LocalBusinessFactoryCoreInput,
    config: LocalBusinessFactoryCoreConfiguration,
    existing?: LocalBusinessProject | null,
  ): LocalBusinessProject {
    projectSequence += 1;
    const now = new Date().toISOString();
    const base = existing ?? null;

    const businessProjectId =
      input.businessProjectId?.trim() ||
      base?.businessProjectId ||
      `lbfc-prj-${Date.now()}-${projectSequence}`;
    const businessName =
      input.businessName?.trim() ||
      base?.businessName ||
      `Local Business ${businessProjectId}`;
    const businessObjective =
      input.businessObjective?.trim() ||
      base?.businessObjective ||
      `Coordinate local business lifecycle for ${businessName}.`;
    const businessCategory = normalizeType(
      input.businessCategory || base?.businessCategory || "unknown",
    ) as BusinessCategory | string;

    const outstandingIssues = unique([
      ...(input.outstandingIssues ?? base?.outstandingIssues ?? []),
    ]);

    const preservedDecisions = unique([
      ...(base?.preservedDecisions ?? []),
      input.grandKingApproved === true ? "grand_king_approved=true" : "",
      input.pillowCommandConfirmed === true ? "pillow_command_confirmed=true" : "",
    ]);

    const traceabilityRefs = unique([
      ...(base?.traceabilityRefs ?? []),
      `q7-01:local_business:${businessProjectId}`,
    ]);

    const project: LocalBusinessProject = {
      factoryMissionId:
        input.factoryMissionId?.trim() ||
        base?.factoryMissionId ||
        `lbfc-msn-${Date.now()}-${projectSequence}`,
      businessProjectId,
      timestamp: now,
      businessCategory,
      businessName,
      businessObjective,
      currentLifecycleStage: (input.currentLifecycleStage ??
        base?.currentLifecycleStage ??
        "opportunity_discovered") as LifecycleStage | string,
      currentStatus: (base?.currentStatus ?? "drafted") as MissionStatus | string,
      assignedWorkers: [...(input.assignedWorkers ?? base?.assignedWorkers ?? [])],
      assignedWorkerRoles: [
        ...(input.assignedWorkerRoles ?? base?.assignedWorkerRoles ?? []),
      ],
      approvalStatus: (input.approvalStatus ??
        base?.approvalStatus ??
        "pending") as ApprovalStatus | string,
      launchReadiness: (input.launchReadiness ??
        base?.launchReadiness ??
        "not_started") as LaunchReadinessStatus | string,
      customerAcquisitionStatus: (input.customerAcquisitionStatus ??
        base?.customerAcquisitionStatus ??
        "not_started") as CustomerAcquisitionStatus | string,
      operationalStatus: (input.operationalStatus ??
        base?.operationalStatus ??
        "not_started") as OperationalStatus | string,
      outstandingIssues,
      executiveSummary:
        input.executiveSummary?.trim() ||
        base?.executiveSummary ||
        `Local Business Factory orchestration for ${businessName}.`,
      confidenceScore: 0,
      missionCoordinationRef: base?.missionCoordinationRef ?? null,
      submittedToExecutiveReporting: base?.submittedToExecutiveReporting ?? false,
      executiveReportId: base?.executiveReportId ?? null,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: LBFC_METADATA_VERSION,
      missionVersion: LOCAL_BUSINESS_MISSION_VERSION,
      workerId: config.workerId || LOCAL_BUSINESS_FACTORY_CORE_IDENTITY.workerId,
      neverPerformSpecialistWorkerFunctions: true,
      neverReplaceQ7Workers: true,
      neverModifyUnrelatedFactories: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateOperationalStatus: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ702OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    project.confidenceScore = computeConfidenceScore(project);
    return project;
  }

  registerLocalBusinessProject(
    project: LocalBusinessProject,
    input: LocalBusinessFactoryCoreInput,
  ): LocalBusinessProject {
    const businessProjectId =
      input.businessProjectId?.trim() ||
      project.businessProjectId ||
      `lbfc-prj-${Date.now()}-${projectSequence}`;
    const businessName =
      input.businessName?.trim() || project.businessName || businessProjectId;
    const businessCategory = normalizeType(
      input.businessCategory || project.businessCategory || "unknown",
    ) as BusinessCategory | string;

    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      businessProjectId,
      businessName,
      businessCategory,
      currentLifecycleStage: "project_registered",
      currentStatus: "active",
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:project:${businessProjectId}`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  advanceStage(
    project: LocalBusinessProject,
    targetStage: LifecycleStage | string,
  ): LocalBusinessProject {
    const stageOrder = [...LIFECYCLE_STAGES] as LifecycleStage[];
    const currentIdx = stageOrder.indexOf(project.currentLifecycleStage as LifecycleStage);
    const targetIdx = stageOrder.indexOf(targetStage as LifecycleStage);
    const nextStage =
      targetIdx >= 0
        ? (targetStage as LifecycleStage)
        : currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? stageOrder[currentIdx + 1]!
          : project.currentLifecycleStage;

    let currentStatus: MissionStatus | string = project.currentStatus;
    if (nextStage === "workers_assigned" || nextStage === "preparation") {
      currentStatus = nextStage === "preparation" ? "preparing" : "coordinating";
    } else if (nextStage === "launch_readiness") {
      currentStatus = "launch_ready";
    } else if (nextStage === "launched") {
      currentStatus = "launched";
    } else if (nextStage === "customer_acquisition") {
      currentStatus = "acquiring_customers";
    } else if (nextStage === "fulfilment") {
      currentStatus = "fulfilling";
    } else if (nextStage === "ongoing_operations") {
      currentStatus = "operating";
    } else if (nextStage === "completed") {
      currentStatus = "completed";
    } else if (nextStage === "project_registered") {
      currentStatus = "active";
    }

    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: nextStage,
      currentStatus,
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  assignWorkers(
    project: LocalBusinessProject,
    workers: string[],
    roles: string[],
  ): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      assignedWorkers: unique([...project.assignedWorkers, ...workers]),
      assignedWorkerRoles: unique([...project.assignedWorkerRoles, ...roles]),
      currentLifecycleStage:
        project.currentLifecycleStage === "opportunity_discovered" ||
        project.currentLifecycleStage === "project_registered"
          ? "workers_assigned"
          : project.currentLifecycleStage,
      currentStatus: "coordinating",
      operationalStatus:
        project.operationalStatus === "not_started"
          ? "coordinating"
          : project.operationalStatus,
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyApproval(
    project: LocalBusinessProject,
    approvalStatus: ApprovalStatus | string,
    grandKingApproved: boolean,
  ): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      approvalStatus,
      currentStatus:
        approvalStatus === "approved"
          ? "active"
          : approvalStatus === "rejected" || approvalStatus === "blocked_bypass_attempt"
            ? "rejected"
            : "awaiting_approval",
      preservedDecisions: unique([
        ...project.preservedDecisions,
        `approval_status=${approvalStatus}`,
        `grand_king_approved=${grandKingApproved}`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyLaunchReadiness(
    project: LocalBusinessProject,
    launchReadiness: LaunchReadinessStatus | string = "in_progress",
  ): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "launch_readiness",
      launchReadiness,
      currentStatus:
        launchReadiness === "ready" || launchReadiness === "launched"
          ? "launch_ready"
          : launchReadiness === "blocked"
            ? "preparing"
            : "preparing",
      preservedDecisions: unique([
        ...project.preservedDecisions,
        `launch_readiness=${launchReadiness}`,
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:launch_readiness`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyCustomerAcquisition(
    project: LocalBusinessProject,
    status: CustomerAcquisitionStatus | string = "coordinating",
  ): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "customer_acquisition",
      customerAcquisitionStatus: status,
      currentStatus: "acquiring_customers",
      preservedDecisions: unique([
        ...project.preservedDecisions,
        `customer_acquisition_status=${status}`,
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:customer_acquisition`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyFulfilment(project: LocalBusinessProject): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "fulfilment",
      currentStatus: "fulfilling",
      operationalStatus:
        project.operationalStatus === "not_started"
          ? "coordinating"
          : project.operationalStatus,
      preservedDecisions: unique([
        ...project.preservedDecisions,
        "coordinate_fulfilment=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:fulfilment`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyOngoingOperations(
    project: LocalBusinessProject,
    operationalStatus: OperationalStatus | string = "operating",
  ): LocalBusinessProject {
    // Never fabricate success — only accept observed coordination statuses.
    const safeStatus =
      operationalStatus === "coordinating" ||
      operationalStatus === "operating" ||
      operationalStatus === "degraded" ||
      operationalStatus === "blocked" ||
      operationalStatus === "completed" ||
      operationalStatus === "not_started"
        ? operationalStatus
        : "coordinating";

    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "ongoing_operations",
      currentStatus: "operating",
      operationalStatus: safeStatus,
      preservedDecisions: unique([
        ...project.preservedDecisions,
        `operational_status=${safeStatus}`,
        "coordinate_ongoing_operations=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:ongoing_operations`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyPreparation(project: LocalBusinessProject): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "preparation",
      currentStatus: "preparing",
      preservedDecisions: unique([
        ...project.preservedDecisions,
        "coordinate_preparation=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:preparation`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyLaunched(project: LocalBusinessProject): LocalBusinessProject {
    const updated: LocalBusinessProject = {
      ...cloneProject(project),
      currentLifecycleStage: "launched",
      currentStatus: "launched",
      launchReadiness: "launched",
      preservedDecisions: unique([
        ...project.preservedDecisions,
        "coordinate_launch=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q7-01:lifecycle_stage:launched`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  buildReport(project: LocalBusinessProject): LocalBusinessFactoryReport {
    const confidenceScore = computeConfidenceScore(project);
    return {
      factoryId: LOCAL_BUSINESS_FACTORY_CORE_ID,
      timestamp: new Date().toISOString(),
      businessProjectId: project.businessProjectId,
      businessCategory: project.businessCategory,
      businessName: project.businessName,
      currentLifecycleStage: project.currentLifecycleStage,
      assignedWorkers: [...project.assignedWorkers],
      launchReadiness: project.launchReadiness,
      customerAcquisitionStatus: project.customerAcquisitionStatus,
      operationalStatus: project.operationalStatus,
      outstandingIssues: [...project.outstandingIssues],
      executiveSummary: project.executiveSummary,
      confidenceScore,
      metadataVersion: LBFC_METADATA_VERSION,
      reportVersion: LOCAL_BUSINESS_FACTORY_REPORT_VERSION,
      workerId: project.workerId,
      factoryMissionId: project.factoryMissionId,
      approvalStatus: project.approvalStatus,
      missionCoordinationRef: project.missionCoordinationRef,
      submittedToExecutiveReporting: project.submittedToExecutiveReporting,
      executiveReportId: project.executiveReportId,
      assignedWorkerRoles: [...project.assignedWorkerRoles],
      preservedDecisions: [...project.preservedDecisions],
      traceabilityRefs: [...project.traceabilityRefs],
      neverPerformSpecialistWorkerFunctions: true,
      neverReplaceQ7Workers: true,
      neverModifyUnrelatedFactories: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateOperationalStatus: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ702OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}

let projectSequence = 0;

export function resetMissionSequenceForTesting() {
  projectSequence = 0;
}

/** Confidence 0–100 from observed fields only — never fabricates success. */
export function computeConfidenceScore(project: LocalBusinessProject): number {
  let score = 0;
  const checks: Array<boolean> = [
    !!project.factoryMissionId,
    !!project.businessProjectId,
    !!project.businessName?.trim(),
    !!project.businessCategory && project.businessCategory !== "unknown",
    !!project.currentLifecycleStage,
    !!project.currentStatus && project.currentStatus !== "drafted",
    project.assignedWorkers.length > 0,
    project.approvalStatus === "approved",
    project.launchReadiness !== "not_started",
    project.customerAcquisitionStatus !== "not_started",
    project.operationalStatus !== "not_started",
    project.traceabilityRefs.some((r) => r.includes("q7-01")),
    !!project.executiveSummary?.trim(),
    project.outstandingIssues.length === 0,
  ];
  const weight = 100 / checks.length;
  for (const ok of checks) {
    if (ok) score += weight;
  }
  return Math.min(100, Math.round(score));
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneProject(project: LocalBusinessProject): LocalBusinessProject {
  return {
    ...project,
    assignedWorkers: [...project.assignedWorkers],
    assignedWorkerRoles: [...project.assignedWorkerRoles],
    outstandingIssues: [...project.outstandingIssues],
    preservedDecisions: [...project.preservedDecisions],
    traceabilityRefs: [...project.traceabilityRefs],
  };
}

function cloneReport(report: LocalBusinessFactoryReport): LocalBusinessFactoryReport {
  return {
    ...report,
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    outstandingIssues: [...report.outstandingIssues],
    preservedDecisions: [...report.preservedDecisions],
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
