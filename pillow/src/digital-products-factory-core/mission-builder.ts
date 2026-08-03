import type { DigitalProductsFactoryCoreConfiguration } from "./configuration.js";
import {
  DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION,
  DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY,
  DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION,
  DPF_METADATA_VERSION,
  PIPELINE_STAGES,
} from "./paths.js";
import type {
  AnalyticsStatus,
  ApprovalStatus,
  DigitalProductBusinessMission,
  DigitalProductsFactoryCoreCatalog,
  DigitalProductsFactoryCoreInput,
  DigitalProductsFactoryReport,
  FulfilmentStatus,
  IntegrationHandshake,
  LearningStatus,
  MissionStatus,
  PipelineStage,
  PipelineType,
  ProductionStatus,
  ProductType,
} from "./types.js";

/** Pure Digital Products Factory Core helpers for Q5-01 — orchestration only. */
export class MissionBuilder {
  buildCatalog(
    config: DigitalProductsFactoryCoreConfiguration,
    missions: DigitalProductBusinessMission[],
    reports: DigitalProductsFactoryReport[],
    integrations: IntegrationHandshake[],
  ): DigitalProductsFactoryCoreCatalog {
    return {
      missionVersion: DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION,
      reportVersion: DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      productTypes: [...config.productTypes],
      pipelineTypes: [...config.pipelineTypes],
      missions: missions.map(cloneMission),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: DPF_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverCreateEbooks: true,
      neverCreateCourses: true,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  buildMission(
    input: DigitalProductsFactoryCoreInput,
    config: DigitalProductsFactoryCoreConfiguration,
    existing?: DigitalProductBusinessMission | null,
  ): DigitalProductBusinessMission {
    missionSequence += 1;
    const now = new Date().toISOString();
    const base = existing ?? null;

    const businessId =
      input.businessId?.trim() ||
      base?.businessId ||
      `dbiz-${Date.now()}-${missionSequence}`;
    const businessName =
      input.businessName?.trim() ||
      base?.businessName ||
      `Digital Product Business ${businessId}`;
    const missionObjective =
      input.missionObjective?.trim() ||
      base?.missionObjective ||
      `Coordinate digital product creation and fulfilment for ${businessName}.`;

    const productType = normalizeType(
      input.productType || base?.productType || "unknown",
    ) as ProductType | string;
    const pipelineType = normalizeType(
      input.pipelineType || base?.pipelineType || "multi_stage",
    ) as PipelineType | string;

    const productPortfolio = unique([
      ...(input.productPortfolio ?? base?.productPortfolio ?? []),
    ]);
    const activeProducts = unique([
      ...(input.activeProducts ?? base?.activeProducts ?? []),
    ]);

    const preservedDecisions = unique([
      ...(base?.preservedDecisions ?? []),
      input.grandKingApproved === true ? "grand_king_approved=true" : "",
      input.pillowCommandConfirmed === true ? "pillow_command_confirmed=true" : "",
    ]);

    const traceabilityRefs = unique([
      ...(base?.traceabilityRefs ?? []),
      `q5-01:digital_product_business:${businessId}`,
    ]);

    return {
      factoryMissionId:
        input.factoryMissionId?.trim() ||
        base?.factoryMissionId ||
        `dpf-dpm-${Date.now()}-${missionSequence}`,
      timestamp: now,
      businessId,
      businessName,
      missionObjective,
      productPortfolio,
      activeProducts,
      productType,
      pipelineId: input.pipelineId?.trim() ?? base?.pipelineId ?? null,
      pipelineType,
      pipelineName: input.pipelineName?.trim() ?? base?.pipelineName ?? null,
      currentPipelineStage: (input.currentPipelineStage ??
        base?.currentPipelineStage ??
        "mission_created") as PipelineStage | string,
      currentStatus: (base?.currentStatus ?? "drafted") as MissionStatus | string,
      assignedWorkers: [...(input.assignedWorkers ?? base?.assignedWorkers ?? [])],
      assignedWorkerRoles: [
        ...(input.assignedWorkerRoles ?? base?.assignedWorkerRoles ?? []),
      ],
      approvalStatus: (input.approvalStatus ??
        base?.approvalStatus ??
        "pending") as ApprovalStatus | string,
      fulfilmentStatus: (input.fulfilmentStatus ??
        base?.fulfilmentStatus ??
        "not_ready") as FulfilmentStatus | string,
      analyticsStatus: (input.analyticsStatus ??
        base?.analyticsStatus ??
        "idle") as AnalyticsStatus | string,
      learningStatus: (input.learningStatus ??
        base?.learningStatus ??
        "idle") as LearningStatus | string,
      productionStatus: (input.productionStatus ??
        base?.productionStatus ??
        "not_started") as ProductionStatus | string,
      executiveSummary:
        input.executiveSummary?.trim() ||
        base?.executiveSummary ||
        `Digital Products Factory orchestration for ${businessName}.`,
      missionCoordinationRef: base?.missionCoordinationRef ?? null,
      submittedToExecutiveReporting: base?.submittedToExecutiveReporting ?? false,
      executiveReportId: base?.executiveReportId ?? null,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: DPF_METADATA_VERSION,
      missionVersion: DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION,
      workerId: config.workerId || DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY.workerId,
      neverCreateEbooks: true,
      neverCreateCourses: true,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ502OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  registerBusiness(
    mission: DigitalProductBusinessMission,
    input: DigitalProductsFactoryCoreInput,
  ): DigitalProductBusinessMission {
    const businessId =
      input.businessId?.trim() || mission.businessId || `dbiz-${Date.now()}-${missionSequence}`;
    const businessName =
      input.businessName?.trim() || mission.businessName || businessId;
    const productPortfolio = unique([
      ...mission.productPortfolio,
      ...(input.productPortfolio ?? []),
    ]);
    const activeProducts = unique([
      ...mission.activeProducts,
      ...(input.activeProducts ?? []),
    ]);
    const productType = normalizeType(
      input.productType || mission.productType || "unknown",
    ) as ProductType | string;

    return {
      ...cloneMission(mission),
      businessId,
      businessName,
      productPortfolio,
      activeProducts,
      productType,
      currentPipelineStage: "business_registered",
      currentStatus: "active",
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:business:${businessId}`,
      ]),
    };
  }

  advanceStage(
    mission: DigitalProductBusinessMission,
    targetStage: PipelineStage | string,
  ): DigitalProductBusinessMission {
    const stageOrder = [...PIPELINE_STAGES] as PipelineStage[];
    const currentIdx = stageOrder.indexOf(mission.currentPipelineStage as PipelineStage);
    const targetIdx = stageOrder.indexOf(targetStage as PipelineStage);
    const nextStage =
      targetIdx >= 0
        ? (targetStage as PipelineStage)
        : currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? stageOrder[currentIdx + 1]!
          : mission.currentPipelineStage;

    let currentStatus: MissionStatus | string = mission.currentStatus;
    if (nextStage === "product_creation" || nextStage === "design_branding") {
      currentStatus = "coordinating";
    } else if (nextStage === "sales_page" || nextStage === "checkout") {
      currentStatus = "awaiting_approval";
    } else if (nextStage === "fulfilment" || nextStage === "customer_delivery") {
      currentStatus = "fulfilling";
    } else if (nextStage === "learning") {
      currentStatus = "learning";
    } else if (nextStage === "completed") {
      currentStatus = "completed";
    }

    return {
      ...cloneMission(mission),
      currentPipelineStage: nextStage,
      currentStatus,
    };
  }

  assignWorkers(
    mission: DigitalProductBusinessMission,
    workers: string[],
    roles: string[],
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      assignedWorkers: unique([...mission.assignedWorkers, ...workers]),
      assignedWorkerRoles: unique([...mission.assignedWorkerRoles, ...roles]),
      productionStatus: "coordinating",
      currentStatus: "coordinating",
    };
  }

  applyApproval(
    mission: DigitalProductBusinessMission,
    approvalStatus: ApprovalStatus | string,
    grandKingApproved: boolean,
  ): DigitalProductBusinessMission {
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
          ? "ready_for_fulfilment"
          : mission.productionStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `approval_status=${approvalStatus}`,
        `grand_king_approved=${grandKingApproved}`,
      ]),
    };
  }

  applyProductCreation(
    mission: DigitalProductBusinessMission,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "product_creation",
      currentStatus: "coordinating",
      productionStatus: "in_production",
      pipelineType: "product_creation",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_product_creation=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:product_creation`,
      ]),
    };
  }

  applyDesignBranding(
    mission: DigitalProductBusinessMission,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "design_branding",
      currentStatus: "coordinating",
      productionStatus: "coordinating",
      pipelineType: "design_branding",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_design_branding=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:design_branding`,
      ]),
    };
  }

  applySalesPageCoordination(
    mission: DigitalProductBusinessMission,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "sales_page",
      currentStatus: "coordinating",
      pipelineType: "sales_page",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_sales_page=structural_signal_only",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:sales_page`,
      ]),
    };
  }

  applyCheckoutCoordination(
    mission: DigitalProductBusinessMission,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "checkout",
      currentStatus: "coordinating",
      pipelineType: "checkout",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_checkout=structural_signal_only",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:checkout`,
      ]),
    };
  }

  applyFulfilmentCoordination(
    mission: DigitalProductBusinessMission,
    fulfilmentStatus: FulfilmentStatus | string,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      fulfilmentStatus,
      currentPipelineStage: "fulfilment",
      currentStatus:
        fulfilmentStatus === "fulfilled_signal" ? "fulfilling" : "coordinating",
      pipelineType: "fulfilment",
      productionStatus:
        fulfilmentStatus === "fulfilled_signal"
          ? "ready_for_fulfilment"
          : mission.productionStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `fulfilment_status=${fulfilmentStatus}`,
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:fulfilment`,
      ]),
    };
  }

  applyCustomerDelivery(
    mission: DigitalProductBusinessMission,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "customer_delivery",
      currentStatus: "fulfilling",
      pipelineType: "customer_delivery",
      fulfilmentStatus:
        mission.fulfilmentStatus === "not_ready"
          ? "coordinating"
          : mission.fulfilmentStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        "coordinate_customer_delivery=structural_signal",
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:customer_delivery`,
      ]),
    };
  }

  applyAnalytics(
    mission: DigitalProductBusinessMission,
    analyticsStatus: AnalyticsStatus | string = "collecting",
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: "analytics",
      analyticsStatus,
      learningStatus:
        analyticsStatus === "collecting" ? "collecting" : mission.learningStatus,
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `analytics_status=${analyticsStatus}`,
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:analytics`,
      ]),
    };
  }

  applyLearning(
    mission: DigitalProductBusinessMission,
    learningStatus: LearningStatus | string,
  ): DigitalProductBusinessMission {
    return {
      ...cloneMission(mission),
      currentPipelineStage: learningStatus === "applied" ? "completed" : "learning",
      learningStatus,
      currentStatus: learningStatus === "applied" ? "completed" : "learning",
      preservedDecisions: unique([
        ...mission.preservedDecisions,
        `learning_status=${learningStatus}`,
      ]),
      traceabilityRefs: unique([
        ...mission.traceabilityRefs,
        `q5-01:pipeline_stage:learning`,
      ]),
    };
  }

  buildReport(mission: DigitalProductBusinessMission): DigitalProductsFactoryReport {
    return {
      factoryMissionId: mission.factoryMissionId,
      timestamp: new Date().toISOString(),
      businessId: mission.businessId,
      productPortfolio: [...mission.productPortfolio],
      activeProducts: [...mission.activeProducts],
      currentPipelineStage: mission.currentPipelineStage,
      assignedWorkers: [...mission.assignedWorkers],
      fulfilmentStatus: mission.fulfilmentStatus,
      analyticsStatus: mission.analyticsStatus,
      learningStatus: mission.learningStatus,
      executiveSummary: mission.executiveSummary,
      metadataVersion: DPF_METADATA_VERSION,
      approvalStatus: mission.approvalStatus,
      productionStatus: mission.productionStatus,
      missionCoordinationRef: mission.missionCoordinationRef,
      executiveReportId: mission.executiveReportId,
      submittedToExecutiveReporting: mission.submittedToExecutiveReporting,
      assignedWorkerRoles: [...mission.assignedWorkerRoles],
      pipelineId: mission.pipelineId,
      pipelineType: mission.pipelineType,
      productType: mission.productType,
      businessName: mission.businessName,
      traceabilityRefs: [...mission.traceabilityRefs],
      preservedDecisions: [...mission.preservedDecisions],
      workerId: mission.workerId,
      reportVersion: DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION,
      neverCreateEbooks: true,
      neverCreateCourses: true,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ502OrLater: true,
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

function cloneMission(
  mission: DigitalProductBusinessMission,
): DigitalProductBusinessMission {
  return {
    ...mission,
    productPortfolio: [...mission.productPortfolio],
    activeProducts: [...mission.activeProducts],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}

function cloneReport(report: DigitalProductsFactoryReport): DigitalProductsFactoryReport {
  return {
    ...report,
    productPortfolio: [...report.productPortfolio],
    activeProducts: [...report.activeProducts],
    assignedWorkers: [...report.assignedWorkers],
    assignedWorkerRoles: [...report.assignedWorkerRoles],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: [...report.preservedDecisions],
  };
}
