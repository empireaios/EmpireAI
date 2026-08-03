import type { MediaFactoryCoreConfiguration } from "./configuration.js";
import {
  MEDIA_BUSINESS_MISSION_VERSION,
  MEDIA_FACTORY_CORE_IDENTITY,
  MEDIA_FACTORY_REPORT_VERSION,
  MFC_METADATA_VERSION,
} from "./paths.js";
import type {
  ApprovalStatus,
  ChannelType,
  ContentStage,
  IntegrationHandshake,
  LearningStatus,
  MediaBusinessMission,
  MediaFactoryCoreCatalog,
  MediaFactoryCoreInput,
  MediaFactoryReport,
  MissionStatus,
  PipelineType,
  ProductionStatus,
  PublishingStatus,
} from "./types.js";

/** Pure Media Factory Core helpers for Q4-01 — orchestration only. */
export class MissionBuilder {
  buildCatalog(
    config: MediaFactoryCoreConfiguration,
    missions: MediaBusinessMission[],
    reports: MediaFactoryReport[],
    integrations: IntegrationHandshake[],
  ): MediaFactoryCoreCatalog {
    return {
      missionVersion: MEDIA_BUSINESS_MISSION_VERSION,
      reportVersion: MEDIA_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      channelTypes: [...config.channelTypes],
      pipelineTypes: [...config.pipelineTypes],
      missions: missions.map(cloneMission),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: MFC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverWriteScripts: true,
      neverGenerateImages: true,
      neverGenerateVideos: true,
      neverPublishDirectly: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildMission(
    input: MediaFactoryCoreInput,
    config: MediaFactoryCoreConfiguration,
    existing?: MediaBusinessMission | null,
  ): MediaBusinessMission {
    missionSequence += 1;
    const now = new Date().toISOString();
    const base = existing ?? null;

    const mediaBusinessId =
      input.mediaBusinessId?.trim() ||
      base?.mediaBusinessId ||
      `mbiz-${Date.now()}-${missionSequence}`;
    const mediaBusinessName =
      input.mediaBusinessName?.trim() ||
      base?.mediaBusinessName ||
      `Media Business ${mediaBusinessId}`;
    const missionObjective =
      input.missionObjective?.trim() ||
      base?.missionObjective ||
      `Coordinate media production and publishing for ${mediaBusinessName}.`;

    const channelType = normalizeType(
      input.channelType || base?.channelType || "unknown",
    ) as ChannelType | string;
    const pipelineType = normalizeType(
      input.pipelineType || base?.pipelineType || "multi_format",
    ) as PipelineType | string;

    const preservedDecisions = unique([
      ...(base?.preservedDecisions ?? []),
      input.grandKingApproved === true ? "grand_king_approved=true" : "",
      input.pillowCommandConfirmed === true ? "pillow_command_confirmed=true" : "",
    ]);

    const traceabilityRefs = unique([
      ...(base?.traceabilityRefs ?? []),
      `q4-01:media_business:${mediaBusinessId}`,
    ]);

    return {
      mediaMissionId:
        input.mediaMissionId?.trim() ||
        base?.mediaMissionId ||
        `mfc-mbm-${Date.now()}-${missionSequence}`,
      timestamp: now,
      mediaBusinessId,
      mediaBusinessName,
      missionObjective,
      channelId: input.channelId?.trim() ?? base?.channelId ?? null,
      channelType,
      channelName: input.channelName?.trim() ?? base?.channelName ?? null,
      pipelineId: input.pipelineId?.trim() ?? base?.pipelineId ?? null,
      pipelineType,
      pipelineName: input.pipelineName?.trim() ?? base?.pipelineName ?? null,
      currentStage: (input.currentStage ??
        base?.currentStage ??
        "mission_created") as ContentStage | string,
      currentStatus: (base?.currentStatus ?? "drafted") as MissionStatus | string,
      assignedWorkers: [...(input.assignedWorkers ?? base?.assignedWorkers ?? [])],
      assignedWorkerRoles: [...(input.assignedWorkerRoles ?? base?.assignedWorkerRoles ?? [])],
      approvalStatus: (input.approvalStatus ??
        base?.approvalStatus ??
        "pending") as ApprovalStatus | string,
      publishingStatus: (input.publishingStatus ??
        base?.publishingStatus ??
        "not_ready") as PublishingStatus | string,
      learningStatus: (input.learningStatus ??
        base?.learningStatus ??
        "idle") as LearningStatus | string,
      productionStatus: (input.productionStatus ??
        base?.productionStatus ??
        "not_started") as ProductionStatus | string,
      executiveSummary:
        input.executiveSummary?.trim() ||
        base?.executiveSummary ||
        `Media Factory orchestration for ${mediaBusinessName}.`,
      missionCoordinationRef: base?.missionCoordinationRef ?? null,
      submittedToExecutiveReporting: base?.submittedToExecutiveReporting ?? false,
      executiveReportId: base?.executiveReportId ?? null,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: MFC_METADATA_VERSION,
      missionVersion: MEDIA_BUSINESS_MISSION_VERSION,
      workerId: config.workerId || MEDIA_FACTORY_CORE_IDENTITY.workerId,
      neverWriteScripts: true,
      neverGenerateImages: true,
      neverGenerateVideos: true,
      neverPublishDirectly: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ402OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  registerChannel(
    mission: MediaBusinessMission,
    input: MediaFactoryCoreInput,
  ): MediaBusinessMission {
    const channelId =
      input.channelId?.trim() || `mfc-ch-${Date.now()}-${missionSequence}`;
    const channelType = normalizeType(
      input.channelType || mission.channelType || "unknown",
    ) as ChannelType | string;
    const channelName =
      input.channelName?.trim() || mission.channelName || channelId;

    return {
      ...cloneMission(mission),
      channelId,
      channelType,
      channelName,
      currentStage: "channel_registered",
      currentStatus: "active",
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q4-01:channel:${channelId}`,
      ]),
    };
  }

  registerPipeline(
    mission: MediaBusinessMission,
    input: MediaFactoryCoreInput,
  ): MediaBusinessMission {
    const pipelineId =
      input.pipelineId?.trim() || `mfc-pl-${Date.now()}-${missionSequence}`;
    const pipelineType = normalizeType(
      input.pipelineType || mission.pipelineType || "multi_format",
    ) as PipelineType | string;
    const pipelineName =
      input.pipelineName?.trim() || mission.pipelineName || pipelineId;

    return {
      ...cloneMission(mission),
      pipelineId,
      pipelineType,
      pipelineName,
      currentStage: "pipeline_registered",
      currentStatus: "active",
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q4-01:pipeline:${pipelineId}`,
      ]),
    };
  }

  advanceStage(
    mission: MediaBusinessMission,
    targetStage: ContentStage | string,
  ): MediaBusinessMission {
    const stageOrder: ContentStage[] = [
      "mission_created",
      "channel_registered",
      "pipeline_registered",
      "production",
      "approval",
      "publishing",
      "analytics",
      "learning",
      "completed",
    ];
    const currentIdx = stageOrder.indexOf(mission.currentStage as ContentStage);
    const targetIdx = stageOrder.indexOf(targetStage as ContentStage);
    const nextStage =
      targetIdx >= 0
        ? (targetStage as ContentStage)
        : currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? stageOrder[currentIdx + 1]!
          : mission.currentStage;

    let currentStatus: MissionStatus | string = mission.currentStatus;
    if (nextStage === "production") currentStatus = "coordinating";
    else if (nextStage === "approval") currentStatus = "awaiting_approval";
    else if (nextStage === "publishing") currentStatus = "publishing";
    else if (nextStage === "learning") currentStatus = "learning";
    else if (nextStage === "completed") currentStatus = "completed";

    return {
      ...cloneMission(mission),
      currentStage: nextStage,
      currentStatus,
    };
  }

  assignWorkers(
    mission: MediaBusinessMission,
    workers: string[],
    roles: string[],
  ): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      assignedWorkers: unique([...mission.assignedWorkers, ...workers]),
      assignedWorkerRoles: unique([...mission.assignedWorkerRoles, ...roles]),
      productionStatus: "coordinating",
      currentStatus: "coordinating",
    };
  }

  applyApproval(
    mission: MediaBusinessMission,
    approvalStatus: ApprovalStatus | string,
    grandKingApproved: boolean,
  ): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      approvalStatus,
      currentStage: approvalStatus === "approved" ? "approval" : mission.currentStage,
      currentStatus:
        approvalStatus === "approved"
          ? "active"
          : approvalStatus === "rejected" || approvalStatus === "blocked_bypass_attempt"
            ? "rejected"
            : "awaiting_approval",
      productionStatus:
        approvalStatus === "approved" ? "ready_to_publish" : mission.productionStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `approval_status=${approvalStatus}`,
        `grand_king_approved=${grandKingApproved}`,
      ]),
    };
  }

  applyPublishingCoordination(
    mission: MediaBusinessMission,
    publishingStatus: PublishingStatus | string,
  ): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      publishingStatus,
      currentStage:
        publishingStatus === "published_signal" ? "publishing" : mission.currentStage,
      currentStatus:
        publishingStatus === "published_signal" ? "publishing" : mission.currentStatus,
    };
  }

  applyAnalytics(mission: MediaBusinessMission): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      currentStage: "analytics",
      learningStatus: "collecting",
    };
  }

  applyLearning(
    mission: MediaBusinessMission,
    learningStatus: LearningStatus | string,
  ): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      currentStage: learningStatus === "applied" ? "completed" : "learning",
      learningStatus,
      currentStatus: learningStatus === "applied" ? "completed" : "learning",
    };
  }

  trackProduction(
    mission: MediaBusinessMission,
    productionStatus: ProductionStatus | string,
  ): MediaBusinessMission {
    return {
      ...cloneMission(mission),
      productionStatus,
      currentStage:
        productionStatus === "in_production" ? "production" : mission.currentStage,
    };
  }

  buildReport(mission: MediaBusinessMission): MediaFactoryReport {
    return {
      mediaMissionId: mission.mediaMissionId,
      timestamp: new Date().toISOString(),
      mediaBusinessId: mission.mediaBusinessId,
      channelId: mission.channelId,
      channelType: mission.channelType,
      contentPipeline: mission.pipelineType,
      currentStage: mission.currentStage,
      assignedWorkers: [...mission.assignedWorkers],
      approvalStatus: mission.approvalStatus,
      publishingStatus: mission.publishingStatus,
      learningStatus: mission.learningStatus,
      executiveSummary: mission.executiveSummary,
      metadataVersion: MFC_METADATA_VERSION,
      productionStatus: mission.productionStatus,
      missionCoordinationRef: mission.missionCoordinationRef,
      executiveReportId: mission.executiveReportId,
      submittedToExecutiveReporting: mission.submittedToExecutiveReporting,
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      pipelineId: mission.pipelineId,
      traceabilityRefs: [...mission.traceabilityRefs],
      preservedDecisions: [...mission.preservedDecisions],
      workerId: mission.workerId,
      reportVersion: MEDIA_FACTORY_REPORT_VERSION,
      neverWriteScripts: true,
      neverGenerateImages: true,
      neverGenerateVideos: true,
      neverPublishDirectly: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ402OrLater: true,
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

function cloneMission(mission: MediaBusinessMission): MediaBusinessMission {
  return {
    ...mission,
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: MediaFactoryReport): MediaFactoryReport {
  return {
    ...report,
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
