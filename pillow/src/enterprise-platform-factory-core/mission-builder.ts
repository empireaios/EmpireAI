import type { EnterprisePlatformFactoryCoreConfiguration } from "./configuration.js";
import {
  ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY,
  ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION,
  ENTERPRISE_PLATFORM_MISSION_VERSION,
  EPFC_METADATA_VERSION,
  PIPELINE_STAGES,
} from "./paths.js";
import type {
  ApprovalStatus,
  DeploymentStatus,
  EnterprisePlatformFactoryCoreCatalog,
  EnterprisePlatformFactoryCoreInput,
  EnterprisePlatformFactoryReport,
  EnterprisePlatformMission,
  IntegrationHandshake,
  LifecycleStage,
  MissionStatus,
  PipelineType,
  PlatformType,
  ProductionStatus,
  TestingStatus,
} from "./types.js";

/** Pure Enterprise Platform Factory Core helpers for Q6-01 — orchestration only. */
export class MissionBuilder {
  buildCatalog(
    config: EnterprisePlatformFactoryCoreConfiguration,
    missions: EnterprisePlatformMission[],
    reports: EnterprisePlatformFactoryReport[],
    integrations: IntegrationHandshake[],
  ): EnterprisePlatformFactoryCoreCatalog {
    return {
      missionVersion: ENTERPRISE_PLATFORM_MISSION_VERSION,
      reportVersion: ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      platformTypes: [...config.platformTypes],
      pipelineTypes: [...config.pipelineTypes],
      missions: missions.map(cloneMission),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: EPFC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildFrontend: true,
      neverBuildBackend: true,
      neverDesignDatabases: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildMission(
    input: EnterprisePlatformFactoryCoreInput,
    config: EnterprisePlatformFactoryCoreConfiguration,
    existing?: EnterprisePlatformMission | null,
  ): EnterprisePlatformMission {
    missionSequence += 1;
    const now = new Date().toISOString();
    const base = existing ?? null;

    const platformId =
      input.platformId?.trim() ||
      base?.platformId ||
      `epfc-plt-${Date.now()}-${missionSequence}`;
    const platformName =
      input.platformName?.trim() ||
      base?.platformName ||
      `Enterprise Platform ${platformId}`;
    const businessId =
      input.businessId?.trim() ||
      base?.businessId ||
      `epfc-biz-${Date.now()}-${missionSequence}`;
    const businessObjective =
      input.businessObjective?.trim() ||
      base?.businessObjective ||
      `Coordinate software platform lifecycle for ${platformName}.`;

    const platformType = normalizeType(
      input.platformType || base?.platformType || "unknown",
    ) as PlatformType | string;
    const pipelineType = normalizeType(
      input.pipelineType || base?.pipelineType || "multi_stage",
    ) as PipelineType | string;

    const platformPortfolio = unique([
      ...(input.platformPortfolio ?? base?.platformPortfolio ?? []),
    ]);
    const activePlatforms = unique([
      ...(input.activePlatforms ?? base?.activePlatforms ?? []),
    ]);
    const activeDependencies = unique([
      ...(input.activeDependencies ?? base?.activeDependencies ?? []),
    ]);

    const preservedDecisions = unique([
      ...(base?.preservedDecisions ?? []),
      input.grandKingApproved === true ? "grand_king_approved=true" : "",
      input.pillowCommandConfirmed === true ? "pillow_command_confirmed=true" : "",
    ]);

    const traceabilityRefs = unique([
      ...(base?.traceabilityRefs ?? []),
      `q6-01:enterprise_platform:${platformId}`,
    ]);

    return {
      factoryMissionId:
        input.factoryMissionId?.trim() ||
        base?.factoryMissionId ||
        `epfc-msn-${Date.now()}-${missionSequence}`,
      timestamp: now,
      platformId,
      platformName,
      businessId,
      businessObjective,
      platformPortfolio,
      activePlatforms,
      platformType,
      pipelineId: input.pipelineId?.trim() ?? base?.pipelineId ?? null,
      pipelineType,
      pipelineName: input.pipelineName?.trim() ?? base?.pipelineName ?? null,
      currentLifecycleStage: (input.currentLifecycleStage ??
        base?.currentLifecycleStage ??
        "mission_created") as LifecycleStage | string,
      currentStatus: (base?.currentStatus ?? "drafted") as MissionStatus | string,
      assignedWorkers: [...(input.assignedWorkers ?? base?.assignedWorkers ?? [])],
      assignedWorkerRoles: [
        ...(input.assignedWorkerRoles ?? base?.assignedWorkerRoles ?? []),
      ],
      activeDependencies,
      approvalStatus: (input.approvalStatus ??
        base?.approvalStatus ??
        "pending") as ApprovalStatus | string,
      testingStatus: (input.testingStatus ??
        base?.testingStatus ??
        "pending") as TestingStatus | string,
      deploymentStatus: (input.deploymentStatus ??
        base?.deploymentStatus ??
        "pending") as DeploymentStatus | string,
      productionStatus: (input.productionStatus ??
        base?.productionStatus ??
        "not_started") as ProductionStatus | string,
      executiveSummary:
        input.executiveSummary?.trim() ||
        base?.executiveSummary ||
        `Enterprise Platform Factory orchestration for ${platformName}.`,
      missionCoordinationRef: base?.missionCoordinationRef ?? null,
      submittedToExecutiveReporting: base?.submittedToExecutiveReporting ?? false,
      executiveReportId: base?.executiveReportId ?? null,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: EPFC_METADATA_VERSION,
      missionVersion: ENTERPRISE_PLATFORM_MISSION_VERSION,
      workerId: config.workerId || ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.workerId,
      neverBuildFrontend: true,
      neverBuildBackend: true,
      neverDesignDatabases: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ602OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  registerSoftwarePlatform(
    mission: EnterprisePlatformMission,
    input: EnterprisePlatformFactoryCoreInput,
  ): EnterprisePlatformMission {
    const platformId =
      input.platformId?.trim() || mission.platformId || `epfc-plt-${Date.now()}-${missionSequence}`;
    const platformName =
      input.platformName?.trim() || mission.platformName || platformId;
    const platformPortfolio = unique([
      ...mission.platformPortfolio,
      ...(input.platformPortfolio ?? []),
    ]);
    const activePlatforms = unique([
      ...mission.activePlatforms,
      ...(input.activePlatforms ?? []),
    ]);
    const platformType = normalizeType(
      input.platformType || mission.platformType || "unknown",
    ) as PlatformType | string;

    return {
      ...cloneMission(mission),
      platformId,
      platformName,
      platformPortfolio,
      activePlatforms,
      platformType,
      currentLifecycleStage: "platform_registered",
      currentStatus: "active",
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:platform:${platformId}`,
      ]),
    };
  }

  advanceStage(
    mission: EnterprisePlatformMission,
    targetStage: LifecycleStage | string,
  ): EnterprisePlatformMission {
    const stageOrder = [...PIPELINE_STAGES] as LifecycleStage[];
    const currentIdx = stageOrder.indexOf(mission.currentLifecycleStage as LifecycleStage);
    const targetIdx = stageOrder.indexOf(targetStage as LifecycleStage);
    const nextStage =
      targetIdx >= 0
        ? (targetStage as LifecycleStage)
        : currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? stageOrder[currentIdx + 1]!
          : mission.currentLifecycleStage;

    let currentStatus: MissionStatus | string = mission.currentStatus;
    if (nextStage === "software_development" || nextStage === "architecture") {
      currentStatus = "coordinating";
    } else if (nextStage === "implementation") {
      currentStatus = "coordinating";
    } else if (nextStage === "testing") {
      currentStatus = "testing";
    } else if (nextStage === "deployment") {
      currentStatus = "deploying";
    } else if (nextStage === "production_operations") {
      currentStatus = "operating";
    } else if (nextStage === "completed") {
      currentStatus = "completed";
    }

    return {
      ...cloneMission(mission),
      currentLifecycleStage: nextStage,
      currentStatus,
    };
  }

  assignWorkers(
    mission: EnterprisePlatformMission,
    workers: string[],
    roles: string[],
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      assignedWorkers: unique([...mission.assignedWorkers, ...workers]),
      assignedWorkerRoles: unique([...mission.assignedWorkerRoles, ...roles]),
      productionStatus: "coordinating",
      currentStatus: "coordinating",
    };
  }

  applyApproval(
    mission: EnterprisePlatformMission,
    approvalStatus: ApprovalStatus | string,
    grandKingApproved: boolean,
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      approvalStatus,
      currentStatus:
        approvalStatus === "approved"
          ? "active"
          : approvalStatus === "rejected" || approvalStatus === "blocked_bypass_attempt"
            ? "rejected"
            : "awaiting_approval",
      productionStatus:
        approvalStatus === "approved"
          ? "ready_for_operations"
          : mission.productionStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `approval_status=${approvalStatus}`,
        `grand_king_approved=${grandKingApproved}`,
      ]),
    };
  }

  applySoftwareDevelopment(
    mission: EnterprisePlatformMission,
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "software_development",
      currentStatus: "coordinating",
      productionStatus: "in_production",
      pipelineType: "software_development",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_software_development=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:software_development`,
      ]),
    };
  }

  applyArchitecture(
    mission: EnterprisePlatformMission,
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "architecture",
      currentStatus: "coordinating",
      productionStatus: "coordinating",
      pipelineType: "architecture",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_architecture=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:architecture`,
      ]),
    };
  }

  applyImplementation(
    mission: EnterprisePlatformMission,
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "implementation",
      currentStatus: "coordinating",
      pipelineType: "implementation",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_implementation=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:implementation`,
      ]),
    };
  }

  applyTesting(
    mission: EnterprisePlatformMission,
    testingStatus: TestingStatus | string = "in_progress",
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "testing",
      testingStatus,
      currentStatus: "testing",
      pipelineType: "testing",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `testing_status=${testingStatus}`,
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:testing`,
      ]),
    };
  }

  applyDeployment(
    mission: EnterprisePlatformMission,
    deploymentStatus: DeploymentStatus | string = "deploying",
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "deployment",
      deploymentStatus,
      currentStatus: "deploying",
      pipelineType: "deployment",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `deployment_status=${deploymentStatus}`,
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:deployment`,
      ]),
    };
  }

  applyProductionOperations(
    mission: EnterprisePlatformMission,
  ): EnterprisePlatformMission {
    return {
      ...cloneMission(mission),
      currentLifecycleStage: "production_operations",
      currentStatus: "operating",
      pipelineType: "production_operations",
      productionStatus: "in_production",
      deploymentStatus:
        mission.deploymentStatus === "pending" ? "deployed" : mission.deploymentStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_production_operations=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q6-01:lifecycle_stage:production_operations`,
      ]),
    };
  }

  buildReport(mission: EnterprisePlatformMission): EnterprisePlatformFactoryReport {
    return {
      factoryMissionId: mission.factoryMissionId,
      timestamp: new Date().toISOString(),
      platformId: mission.platformId,
      platformName: mission.platformName,
      businessObjective: mission.businessObjective,
      platformPortfolio: [...mission.platformPortfolio],
      activePlatforms: [...mission.activePlatforms],
      currentLifecycleStage: mission.currentLifecycleStage,
      assignedWorkers: [...mission.assignedWorkers],
      activeDependencies: [...mission.activeDependencies],
      testingStatus: mission.testingStatus,
      deploymentStatus: mission.deploymentStatus,
      executiveSummary: mission.executiveSummary,
      metadataVersion: EPFC_METADATA_VERSION,
      approvalStatus: mission.approvalStatus,
      productionStatus: mission.productionStatus,
      missionCoordinationRef: mission.missionCoordinationRef,
      executiveReportId: mission.executiveReportId,
      submittedToExecutiveReporting: mission.submittedToExecutiveReporting,
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      pipelineId: mission.pipelineId,
      pipelineType: mission.pipelineType,
      platformType: mission.platformType,
      businessId: mission.businessId,
      traceabilityRefs: [...mission.traceabilityRefs],
      preservedDecisions: [...mission.preservedDecisions],
      workerId: mission.workerId,
      reportVersion: ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION,
      neverBuildFrontend: true,
      neverBuildBackend: true,
      neverDesignDatabases: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ602OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverLogSensitiveEnterpriseInformation: true,
    };
  }
}

let missionSequence = 0;

export function resetMissionSequenceForTesting() {
  missionSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneMission(mission: EnterprisePlatformMission): EnterprisePlatformMission {
  return {
    ...mission,
    platformPortfolio: [...mission.platformPortfolio],
    activePlatforms: [...mission.activePlatforms],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    activeDependencies: [...mission.activeDependencies],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: EnterprisePlatformFactoryReport): EnterprisePlatformFactoryReport {
  return {
    ...report,
    platformPortfolio: [...report.platformPortfolio],
    activePlatforms: [...report.activePlatforms],
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    activeDependencies: [...report.activeDependencies],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
