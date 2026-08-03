import type { BusinessIdeaInterpreterConfiguration } from "./configuration.js";
import type {
  BII_CAPABILITIES,
  BUSINESS_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  MISSING_INFORMATION_FIELDS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type MissingInformationField = (typeof MISSING_INFORMATION_FIELDS)[number];
export type BusinessIdeaInterpreterCapability = (typeof BII_CAPABILITIES)[number];

/** Machine-readable Structured Business Intent (Q2-02). */
export type StructuredBusinessIntent = {
  intentId: string;
  timestamp: string;
  originalCommand: string;
  businessType: BusinessType | string;
  businessIdea: string;
  targetCustomer: string | null;
  productServiceCategory: string | null;
  channelPlatform: string | null;
  constraints: string[];
  successObjective: string | null;
  confidenceScore: number;
  missingInformation: Array<MissingInformationField | string>;
  metadataVersion: string;
  intentVersion: string;
  preparedForLaterQ2Missions: true;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverBuildBusinesses: true;
  neverAssignWorkers: true;
  neverExecuteAnything: true;
  neverImplementQ203OrLater: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type BusinessIdeaInterpreterInput = {
  intentId?: string | null;
  originalCommand?: string | null;
  businessType?: BusinessType | string | null;
  businessIdea?: string | null;
  targetCustomer?: string | null;
  productServiceCategory?: string | null;
  channelPlatform?: string | null;
  constraints?: string[] | null;
  successObjective?: string | null;
  grandKingCommandId?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  generateBusinessModels?: boolean;
  researchMarkets?: boolean;
  buildBusinesses?: boolean;
  assignWorkers?: boolean;
  executeAnything?: boolean;
  implementQ203OrLater?: boolean;
};

export type BusinessIdeaInterpreterValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessIdeaInterpreterEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BII-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BusinessIdeaInterpreterCapability[];
  totalIntents: number;
  lastBusinessType: BusinessType | string | null;
  lastIntentId: string | null;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type BusinessIdeaInterpreterCatalog = {
  intentVersion: string;
  businessTypes: string[];
  intents: StructuredBusinessIntent[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverBuildBusinesses: true;
  neverAssignWorkers: true;
  neverExecuteAnything: true;
  neverImplementQ203OrLater: true;
};

export type BusinessIdeaInterpreterRunReport = {
  interpreterRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "accept_command"
    | "interpret"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: BusinessIdeaInterpreterEngineRecord;
  catalog: BusinessIdeaInterpreterCatalog | null;
  intents: StructuredBusinessIntent[];
  latestIntent: StructuredBusinessIntent | null;
  validation: BusinessIdeaInterpreterValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessIdeaInterpreterState = {
  engineVersion: "PILLOW-BII-001";
  missionId: "Q2-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessIdeaInterpreterConfiguration;
  latestReport: BusinessIdeaInterpreterRunReport | null;
  engineRecord: BusinessIdeaInterpreterEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalIntents: number;
    lastIntentId: string | null;
    notes: string[];
  };
};

export type BusinessIdeaInterpreterCockpitSnapshot = {
  missionId: "Q2-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalIntents: number;
  latestIntentId: string | null;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverBuildBusinesses: true;
  neverAssignWorkers: true;
  neverExecuteAnything: true;
  neverImplementQ203OrLater: true;
};
