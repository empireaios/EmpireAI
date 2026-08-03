import type { EmpireBuilderFactoryCoreConfiguration } from "./configuration.js";
import {
  BUSINESS_BUILD_MISSION_VERSION,
  BUSINESS_TYPES,
  EBF_METADATA_VERSION,
} from "./paths.js";
import type {
  ApprovalStatus,
  BusinessBuildMissionRecord,
  BusinessType,
  EmpireBuilderFactoryCatalog,
  EmpireBuilderFactoryInput,
  MissionStatus,
  RequiredNextStep,
} from "./types.js";

/** Pure Empire Builder Factory helpers for Q2-01 — create mission containers only. */
export class MissionBuilder {
  buildCatalog(
    config: EmpireBuilderFactoryCoreConfiguration,
    missions: BusinessBuildMissionRecord[],
  ): EmpireBuilderFactoryCatalog {
    return {
      missionVersion: BUSINESS_BUILD_MISSION_VERSION,
      businessTypes: [...config.businessTypes],
      missions: missions.map(cloneMission),
      metadataVersion: EBF_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverInterpretDetailedBusinessStrategy: true,
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverAssignWorkers: true,
      neverExecuteBusinesses: true,
      neverLaunchBusinesses: true,
      neverImplementQ202OrLater: true,
    };
  }

  classifyBusinessType(
    command: string,
    config: EmpireBuilderFactoryCoreConfiguration,
    explicit?: string | null,
  ): BusinessType | string {
    if (explicit?.trim()) {
      const normalized = normalizeType(explicit.trim());
      if (config.businessTypes.includes(normalized)) return normalized;
      return normalized;
    }

    const text = command.toLowerCase();
    const rules: Array<{ type: BusinessType; patterns: RegExp[] }> = [
      { type: "media", patterns: [/\bmedia\b/, /\bcontent\b/, /\bpublish/] },
      { type: "commerce", patterns: [/\bcommerce\b/, /\be-?commerce\b/, /\bstore\b/, /\bretail\b/] },
      {
        type: "local_cleaning",
        patterns: [/\bcleaning\b/, /\bcleaner\b/, /\bjanitorial\b/],
      },
      { type: "affiliate", patterns: [/\baffiliate\b/, /\breferral\b/] },
      {
        type: "digital_product",
        patterns: [/\bdigital product\b/, /\binfo[- ]?product\b/, /\be-?book\b/, /\bcourse\b/],
      },
      { type: "local_services", patterns: [/\blocal service/, /\blocal business\b/] },
      { type: "saas", patterns: [/\bsaas\b/, /\bsoftware as a service\b/] },
      { type: "agency", patterns: [/\bagency\b/] },
    ];

    for (const rule of rules) {
      if (!config.businessTypes.includes(rule.type)) continue;
      if (rule.patterns.some((p) => p.test(text))) return rule.type;
    }
    return "unknown";
  }

  deriveObjective(command: string, businessType: string): string {
    const typeLabel = businessType.replace(/_/g, " ");
    return `Establish a standardized business-building mission to build a ${typeLabel} business from the Grand King command: "${command.trim()}".`;
  }

  deriveExpectedOutput(businessType: string): string {
    switch (businessType) {
      case "media":
        return "Prepared media business-building mission ready for later Q2 workers.";
      case "commerce":
        return "Prepared commerce business-building mission ready for later Q2 workers.";
      case "local_cleaning":
        return "Prepared local cleaning business-building mission ready for later Q2 workers.";
      case "affiliate":
        return "Prepared affiliate business-building mission ready for later Q2 workers.";
      case "digital_product":
        return "Prepared digital product business-building mission ready for later Q2 workers.";
      default:
        return `Prepared ${businessType.replace(/_/g, " ")} business-building mission ready for later Q2 workers.`;
    }
  }

  buildMission(params: {
    input: EmpireBuilderFactoryInput;
    config: EmpireBuilderFactoryCoreConfiguration;
    prepared?: boolean;
  }): BusinessBuildMissionRecord {
    missionSequence += 1;
    const originalCommand =
      params.input.originalCommand?.trim() ||
      "Build a business.";
    const businessType = this.classifyBusinessType(
      originalCommand,
      params.config,
      params.input.businessType,
    );
    const missionObjective =
      params.input.missionObjective?.trim() ||
      this.deriveObjective(originalCommand, businessType);
    const expectedBusinessOutput =
      params.input.expectedBusinessOutput?.trim() ||
      this.deriveExpectedOutput(businessType);
    const approvalStatus = normalizeApproval(
      params.input.approvalStatus || params.config.defaultApprovalStatus,
    );
    const prepared = params.prepared ?? true;
    const currentStatus = normalizeStatus(
      params.input.currentStatus ||
        (prepared ? "ready_for_q2_workers" : params.config.defaultMissionStatus),
    );
    const requiredNextStep = normalizeNextStep(
      params.input.requiredNextStep ||
        (prepared ? "hand_off_to_q2_02" : "prepare_for_q2_workers"),
    );
    const traceabilityReference =
      params.input.traceabilityReference?.trim() ||
      params.input.grandKingCommandId?.trim() ||
      `gk-cmd-${Date.now()}-${missionSequence}`;

    return {
      businessBuildMissionId:
        params.input.businessBuildMissionId?.trim() ||
        `ebf-bbm-${Date.now()}-${missionSequence}`,
      timestamp: new Date().toISOString(),
      originalCommand,
      businessType,
      missionObjective,
      expectedBusinessOutput,
      currentStatus,
      requiredNextStep,
      approvalStatus,
      traceabilityReference,
      metadataVersion: EBF_METADATA_VERSION,
      missionVersion: BUSINESS_BUILD_MISSION_VERSION,
      preparedForQ2Workers: true,
      neverInterpretDetailedBusinessStrategy: true,
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverAssignWorkers: true,
      neverExecuteBusinesses: true,
      neverLaunchBusinesses: true,
      neverImplementQ202OrLater: true,
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

function normalizeStatus(value: string): MissionStatus | string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeApproval(value: string): ApprovalStatus | string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeNextStep(value: string): RequiredNextStep | string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function cloneMission(mission: BusinessBuildMissionRecord): BusinessBuildMissionRecord {
  return { ...mission };
}

// Keep BUSINESS_TYPES referenced for type-safety of classifier defaults.
void BUSINESS_TYPES;
