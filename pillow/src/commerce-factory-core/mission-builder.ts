import type { CommerceFactoryCoreConfiguration } from "./configuration.js";
import {
  CMF_METADATA_VERSION,
  COMMERCE_BUILD_MISSION_VERSION,
  COMMERCE_FACTORY_CORE_IDENTITY,
} from "./paths.js";
import type {
  ApprovalStatus,
  BusinessApprovalPackInput,
  BusinessBlueprintInput,
  BusinessType,
  CommerceBuildMission,
  CommerceCategory,
  CommerceFactoryCoreCatalog,
  CommerceFactoryCoreInput,
  IntegrationHandshake,
  MissionStatus,
  RequiredNextStep,
} from "./types.js";

/** Pure Commerce Factory Core helpers for Q3-01 — prepare missions only. */
export class MissionBuilder {
  buildCatalog(
    config: CommerceFactoryCoreConfiguration,
    missions: CommerceBuildMission[],
    integrations: IntegrationHandshake[],
  ): CommerceFactoryCoreCatalog {
    return {
      missionVersion: COMMERCE_BUILD_MISSION_VERSION,
      workerId: config.workerId,
      commerceCategories: [...config.commerceCategories],
      missions: missions.map(cloneMission),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CMF_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildStores: true,
      neverImportProducts: true,
      neverConfigureMarketplaces: true,
      neverExecuteCommerceImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  assessBlueprintCompleteness(blueprint: BusinessBlueprintInput | null | undefined): {
    complete: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    if (!blueprint?.blueprintId?.trim()) missing.push("blueprint_id");
    if (!blueprint?.businessObjective?.trim()) missing.push("business_objective");
    if (!blueprint?.businessType) missing.push("business_type");
    if (!(blueprint?.productsServices?.length)) missing.push("products_services");
    if (!(blueprint?.customerSegments?.length)) missing.push("customer_segments");
    if (!blueprint?.valueProposition?.trim()) missing.push("value_proposition");
    if (!(blueprint?.requiredIntegrations?.length)) missing.push("required_integrations");
    return { complete: missing.length === 0, missing };
  }

  assessApprovalPack(
    pack: BusinessApprovalPackInput | null | undefined,
    config: CommerceFactoryCoreConfiguration,
    grandKingApproved?: boolean | null,
  ): {
    approved: boolean;
    missing: string[];
    recommendation: string | null;
  } {
    const missing: string[] = [];
    if (!pack?.approvalPackId?.trim()) missing.push("approval_pack_id");
    const recommendation = pack?.recommendation?.trim() || null;
    if (config.requireProceedRecommendation) {
      if (!recommendation) missing.push("pack_recommendation");
      else if (recommendation.toLowerCase() !== "proceed") {
        missing.push(`recommendation_not_proceed:${recommendation}`);
      }
    }
    if (config.requireGrandKingApproval && grandKingApproved !== true) {
      missing.push("grand_king_approval");
    }
    return {
      approved: missing.length === 0,
      missing,
      recommendation,
    };
  }

  assessImplementationPrerequisites(
    blueprint: BusinessBlueprintInput | null | undefined,
    pack: BusinessApprovalPackInput | null | undefined,
  ): {
    ready: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    if (!blueprint?.blueprintId) missing.push("approved_business_blueprint");
    if (!pack?.approvalPackId) missing.push("approved_business_approval_pack");
    if (!(blueprint?.requiredIntegrations?.length)) {
      missing.push("commerce_integration_inventory");
    }
    if ((pack?.outstandingIssues?.length ?? 0) > 5) {
      missing.push("too_many_outstanding_issues");
    }
    for (const issue of (pack?.outstandingIssues ?? []).slice(0, 3)) {
      if (/blocker|critical/i.test(issue)) missing.push(`blocking_issue:${issue}`);
    }
    return { ready: missing.length === 0, missing };
  }

  classifyCommerceCategory(
    blueprint: BusinessBlueprintInput | null | undefined,
    pack: BusinessApprovalPackInput | null | undefined,
    config: CommerceFactoryCoreConfiguration,
    explicit?: string | null,
  ): CommerceCategory {
    if (explicit?.trim()) {
      const normalized = normalizeType(explicit);
      if (config.commerceCategories.includes(normalized)) return normalized;
      return normalized;
    }

    const text = [
      blueprint?.businessObjective,
      blueprint?.valueProposition,
      ...(blueprint?.requiredIntegrations ?? []),
      ...(blueprint?.businessArchitecture?.deliveryChannels ?? []),
      pack?.executiveSummary,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const rules: Array<{ category: (typeof config.commerceCategories)[number]; patterns: RegExp[] }> =
      [
        {
          category: "marketplace",
          patterns: [/\bmarketplace\b/, /\bamazon\b/, /\betasy\b/],
        },
        {
          category: "dropshipping",
          patterns: [/\bdrop.?ship/, /\bprint.?on.?demand\b/],
        },
        {
          category: "subscription_commerce",
          patterns: [/\bsubscription\b/, /\brecurring\b/, /\bmembership\b/],
        },
        { category: "wholesale", patterns: [/\bwholesale\b/, /\bb2b\b/] },
        {
          category: "hybrid_commerce",
          patterns: [/\bhybrid\b/, /\bomnichannel\b/],
        },
        {
          category: "online_store",
          patterns: [/\bshopify\b/, /\bonline.?store\b/, /\bstorefront\b/, /\be-?commerce\b/],
        },
      ];

    for (const rule of rules) {
      if (!config.commerceCategories.includes(rule.category)) continue;
      if (rule.patterns.some((p) => p.test(text))) return rule.category;
    }
    return "unknown";
  }

  buildMission(
    input: CommerceFactoryCoreInput,
    config: CommerceFactoryCoreConfiguration,
    options: {
      registered?: boolean;
      missionCoordinationRef?: string | null;
    } = {},
  ): CommerceBuildMission {
    missionSequence += 1;
    const now = new Date().toISOString();
    const blueprint = input.businessBlueprint ?? {};
    const pack = input.businessApprovalPack ?? {};

    const blueprintCheck = this.assessBlueprintCompleteness(blueprint);
    const approvalCheck = this.assessApprovalPack(pack, config, input.grandKingApproved);
    const prereqCheck = this.assessImplementationPrerequisites(blueprint, pack);

    const businessType = normalizeType(
      input.businessType || blueprint.businessType || pack.businessType || "commerce",
    ) as BusinessType | string;
    const commerceCategory = this.classifyCommerceCategory(
      blueprint,
      pack,
      config,
      input.commerceCategory,
    );

    const blueprintId =
      input.businessBlueprintId?.trim() ||
      blueprint.blueprintId?.trim() ||
      pack.sourceRefs?.businessBlueprintId?.trim() ||
      `blueprint-missing-${missionSequence}`;
    const approvalPackId =
      input.businessApprovalPackId?.trim() ||
      pack.approvalPackId?.trim() ||
      `approval-pack-missing-${missionSequence}`;

    const allMissing = unique([
      ...blueprintCheck.missing.map((m) => `blueprint:${m}`),
      ...approvalCheck.missing.map((m) => `approval:${m}`),
      ...prereqCheck.missing,
    ]);

    const approved =
      blueprintCheck.complete && approvalCheck.approved && prereqCheck.ready;
    const approvalStatus: ApprovalStatus = approved
      ? "approved"
      : approvalCheck.missing.includes("grand_king_approval")
        ? "pending_grand_king"
        : "not_approved";

    let currentStatus: MissionStatus = "drafted";
    let requiredNextStep: RequiredNextStep = "verify_grand_king_approval";
    if (!approvalCheck.approved) {
      currentStatus = "rejected";
      requiredNextStep = "verify_grand_king_approval";
    } else if (!blueprintCheck.complete) {
      currentStatus = "rejected";
      requiredNextStep = "verify_blueprint_completeness";
    } else if (!prereqCheck.ready) {
      currentStatus = "rejected";
      requiredNextStep = "verify_implementation_prerequisites";
    } else if (options.registered) {
      currentStatus = "ready_for_q3_workers";
      requiredNextStep = "hand_off_to_q3_02";
    } else {
      currentStatus = "classified";
      requiredNextStep = "register_with_mission_coordination";
    }

    const missionObjective =
      input.missionObjective?.trim() ||
      `Prepare commerce implementation for ${commerceCategory.replace(/_/g, " ")} from approved blueprint ${blueprintId}.`;

    const preservedDecisions = unique([
      ...(blueprint.preservedDecisions ?? []),
      ...(pack.preservedDecisions ?? []),
      approvalCheck.recommendation
        ? `approval_pack_recommendation=${approvalCheck.recommendation}`
        : "",
      `grand_king_approved=${input.grandKingApproved === true}`,
    ]);

    const traceabilityRefs = unique([
      `q2-06:business_blueprint:${blueprintId}`,
      `q2-09:business_approval_pack:${approvalPackId}`,
      ...(blueprint.traceabilityRefs ?? []),
      ...(pack.traceabilityRefs ?? []),
    ]);

    return {
      commerceBuildMissionId:
        input.commerceBuildMissionId?.trim() ||
        `cmf-cbm-${Date.now()}-${missionSequence}`,
      timestamp: now,
      businessBlueprintId: blueprintId,
      businessApprovalPackId: approvalPackId,
      businessType,
      commerceCategory,
      missionObjective,
      currentStatus,
      requiredNextStep,
      approvalStatus,
      grandKingApprovalVerified: input.grandKingApproved === true,
      blueprintCompletenessVerified: blueprintCheck.complete,
      implementationPrerequisitesVerified: prereqCheck.ready,
      missingPrerequisites: allMissing,
      traceabilityReference: `blueprint:${blueprintId}|approval_pack:${approvalPackId}`,
      businessBuildMissionId:
        blueprint.businessBuildMissionId?.trim() ||
        pack.businessBuildMissionId?.trim() ||
        null,
      missionCoordinationRef: options.missionCoordinationRef ?? null,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      preservedDecisions,
      traceabilityRefs,
      metadataVersion: CMF_METADATA_VERSION,
      missionVersion: COMMERCE_BUILD_MISSION_VERSION,
      workerId: config.workerId || COMMERCE_FACTORY_CORE_IDENTITY.workerId,
      neverBuildStores: true,
      neverImportProducts: true,
      neverConfigureMarketplaces: true,
      neverExecuteCommerceImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ302OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
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

function cloneMission(mission: CommerceBuildMission): CommerceBuildMission {
  return {
    ...mission,
    missingPrerequisites: [...mission.missingPrerequisites],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
  };
}
