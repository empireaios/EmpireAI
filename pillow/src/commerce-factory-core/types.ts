import type { CommerceFactoryCoreConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  BUSINESS_TYPES,
  CMF_CAPABILITIES,
  COMMERCE_CATEGORIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MISSION_STATUSES,
  OPERATIONAL_STATES,
  REQUIRED_NEXT_STEPS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type CommerceCategory = (typeof COMMERCE_CATEGORIES)[number] | string;
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type RequiredNextStep = (typeof REQUIRED_NEXT_STEPS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CommerceFactoryCoreCapability = (typeof CMF_CAPABILITIES)[number];

/** Compact approved Business Blueprint input from Q2-06 (read-only). */
export type BusinessBlueprintInput = {
  blueprintId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  businessObjective?: string | null;
  productsServices?: string[] | null;
  customerSegments?: string[] | null;
  valueProposition?: string | null;
  requiredWorkers?: Array<{ workerRole?: string | null }> | null;
  requiredIntegrations?: string[] | null;
  requiredAssets?: string[] | null;
  businessArchitecture?: {
    revenueModel?: string | null;
    costModel?: string | null;
    deliveryChannels?: string[] | null;
    targetMarket?: string | null;
  } | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
  approvedOpportunityRecommendation?: string | null;
};

/** Compact Business Approval Pack input from Q2-09 (read-only). */
export type BusinessApprovalPackInput = {
  approvalPackId?: string | null;
  businessBuildMissionId?: string | null;
  businessType?: BusinessType | string | null;
  recommendation?: string | null;
  executiveSummary?: string | null;
  requiredGrandKingDecisions?: string[] | null;
  outstandingIssues?: string[] | null;
  sourceRefs?: {
    businessBlueprintId?: string | null;
    businessModelId?: string | null;
    launchPlanId?: string | null;
    businessRiskReportId?: string | null;
  } | null;
  preservedDecisions?: string[] | null;
  traceabilityRefs?: string[] | null;
};

/** Machine-readable Commerce Build Mission (Q3-01). */
export type CommerceBuildMission = {
  commerceBuildMissionId: string;
  timestamp: string;
  businessBlueprintId: string;
  businessApprovalPackId: string;
  businessType: BusinessType | string;
  commerceCategory: CommerceCategory;
  missionObjective: string;
  currentStatus: MissionStatus | string;
  requiredNextStep: RequiredNextStep | string;
  approvalStatus: ApprovalStatus | string;
  grandKingApprovalVerified: boolean;
  blueprintCompletenessVerified: boolean;
  implementationPrerequisitesVerified: boolean;
  missingPrerequisites: string[];
  traceabilityReference: string;
  businessBuildMissionId: string | null;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  missionVersion: string;
  workerId: string;
  neverBuildStores: true;
  neverImportProducts: true;
  neverConfigureMarketplaces: true;
  neverExecuteCommerceImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ302OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type CommerceFactoryCoreInput = {
  commerceBuildMissionId?: string | null;
  businessBlueprint?: BusinessBlueprintInput | null;
  businessApprovalPack?: BusinessApprovalPackInput | null;
  businessBlueprintId?: string | null;
  businessApprovalPackId?: string | null;
  businessType?: BusinessType | string | null;
  commerceCategory?: CommerceCategory | null;
  missionObjective?: string | null;
  /** Explicit Grand King approval signal for the pack (required true to proceed). */
  grandKingApproved?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildStores?: boolean;
  importProducts?: boolean;
  configureMarketplaces?: boolean;
  executeCommerceImplementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ302OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CommerceFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CommerceFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CMF-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CommerceFactoryCoreCapability[];
  totalMissions: number;
  lastBusinessType: BusinessType | string | null;
  lastCommerceCategory: CommerceCategory | null;
  lastMissionId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CommerceFactoryCoreCatalog = {
  missionVersion: string;
  workerId: string;
  commerceCategories: string[];
  missions: CommerceBuildMission[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildStores: true;
  neverImportProducts: true;
  neverConfigureMarketplaces: true;
  neverExecuteCommerceImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type CommerceFactoryCoreRunReport = {
  commerceFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_blueprint"
    | "receive_approval_pack"
    | "verify_approval"
    | "verify_blueprint"
    | "verify_prerequisites"
    | "create_mission"
    | "classify_commerce_type"
    | "register_mission"
    | "produce_mission"
    | "submit_mission"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CommerceFactoryCoreEngineRecord;
  catalog: CommerceFactoryCoreCatalog | null;
  missions: CommerceBuildMission[];
  latestMission: CommerceBuildMission | null;
  integrations: IntegrationHandshake[];
  validation: CommerceFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CommerceFactoryCoreState = {
  engineVersion: "PILLOW-CMF-001";
  missionId: "Q3-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: CommerceFactoryCoreConfiguration;
  latestReport: CommerceFactoryCoreRunReport | null;
  engineRecord: CommerceFactoryCoreEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMissions: number;
    lastMissionId: string | null;
    notes: string[];
  };
};

export type CommerceFactoryCoreCockpitSnapshot = {
  missionId: "Q3-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestMissionId: string | null;
  workerId: string;
  neverBuildStores: true;
  neverImportProducts: true;
  neverConfigureMarketplaces: true;
  neverExecuteCommerceImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
