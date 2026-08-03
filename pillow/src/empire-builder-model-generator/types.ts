import type { EmpireBuilderModelGeneratorConfiguration } from "./configuration.js";
import type {
  BUSINESS_MODEL_TYPES,
  BUSINESS_TYPES,
  EMG_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessModelType = (typeof BUSINESS_MODEL_TYPES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type EmpireBuilderModelGeneratorCapability = (typeof EMG_CAPABILITIES)[number];

/** Structured Business Intent input shape received from Q2-02. */
export type StructuredBusinessIntentInput = {
  intentId?: string | null;
  originalCommand?: string | null;
  businessType?: BusinessType | string | null;
  businessIdea?: string | null;
  targetCustomer?: string | null;
  productServiceCategory?: string | null;
  channelPlatform?: string | null;
  constraints?: string[] | null;
  successObjective?: string | null;
  confidenceScore?: number | null;
  missingInformation?: string[] | null;
};

/** Machine-readable Business Model (Q2-03). */
export type EmpireBuilderBusinessModel = {
  businessModelId: string;
  timestamp: string;
  businessType: BusinessType | string;
  businessModelType: BusinessModelType | string;
  valueProposition: string;
  productsServices: string[];
  customerSegments: string[];
  revenueModel: string;
  costModel: string;
  operatingModel: string;
  requiredCapabilities: string[];
  requiredIntegrations: string[];
  businessAssumptions: string[];
  metadataVersion: string;
  modelVersion: string;
  sourceIntentId: string | null;
  originalCommand: string | null;
  preparedForDownstreamPlanning: true;
  neverValidateDemand: true;
  neverPerformMarketResearch: true;
  neverBuildBranding: true;
  neverAssignWorkers: true;
  neverLaunchBusiness: true;
  neverImplementQ204OrLater: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type EmpireBuilderModelGeneratorInput = {
  businessModelId?: string | null;
  intent?: StructuredBusinessIntentInput | null;
  intentId?: string | null;
  originalCommand?: string | null;
  businessType?: BusinessType | string | null;
  businessIdea?: string | null;
  targetCustomer?: string | null;
  productServiceCategory?: string | null;
  channelPlatform?: string | null;
  constraints?: string[] | null;
  successObjective?: string | null;
  confidenceScore?: number | null;
  missingInformation?: string[] | null;
  businessModelType?: BusinessModelType | string | null;
  valueProposition?: string | null;
  productsServices?: string[] | null;
  customerSegments?: string[] | null;
  revenueModel?: string | null;
  costModel?: string | null;
  operatingModel?: string | null;
  requiredCapabilities?: string[] | null;
  requiredIntegrations?: string[] | null;
  businessAssumptions?: string[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  validateDemand?: boolean;
  performMarketResearch?: boolean;
  buildBranding?: boolean;
  assignWorkers?: boolean;
  launchBusiness?: boolean;
  implementQ204OrLater?: boolean;
};

export type EmpireBuilderModelGeneratorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderModelGeneratorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EMG-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EmpireBuilderModelGeneratorCapability[];
  totalModels: number;
  lastBusinessType: BusinessType | string | null;
  lastBusinessModelId: string | null;
  metadataVersion: string;
};

export type EmpireBuilderModelGeneratorCatalog = {
  modelVersion: string;
  businessModelTypes: string[];
  models: EmpireBuilderBusinessModel[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverValidateDemand: true;
  neverPerformMarketResearch: true;
  neverBuildBranding: true;
  neverAssignWorkers: true;
  neverLaunchBusiness: true;
  neverImplementQ204OrLater: true;
};

export type EmpireBuilderModelGeneratorRunReport = {
  modelRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_intent"
    | "generate_model"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: EmpireBuilderModelGeneratorEngineRecord;
  catalog: EmpireBuilderModelGeneratorCatalog | null;
  models: EmpireBuilderBusinessModel[];
  latestModel: EmpireBuilderBusinessModel | null;
  validation: EmpireBuilderModelGeneratorValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderModelGeneratorState = {
  engineVersion: "PILLOW-EMG-001";
  missionId: "Q2-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpireBuilderModelGeneratorConfiguration;
  latestReport: EmpireBuilderModelGeneratorRunReport | null;
  engineRecord: EmpireBuilderModelGeneratorEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalModels: number;
    lastBusinessModelId: string | null;
    notes: string[];
  };
};

export type EmpireBuilderModelGeneratorCockpitSnapshot = {
  missionId: "Q2-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalModels: number;
  latestBusinessModelId: string | null;
  neverValidateDemand: true;
  neverPerformMarketResearch: true;
  neverBuildBranding: true;
  neverAssignWorkers: true;
  neverLaunchBusiness: true;
  neverImplementQ204OrLater: true;
};
