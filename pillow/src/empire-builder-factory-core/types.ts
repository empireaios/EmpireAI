import type { EmpireBuilderFactoryCoreConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  BUSINESS_TYPES,
  EBF_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
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
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type RequiredNextStep = (typeof REQUIRED_NEXT_STEPS)[number];
export type EmpireBuilderFactoryCapability = (typeof EBF_CAPABILITIES)[number];

/** Machine-readable Business Build Mission Record (Q2-01). */
export type BusinessBuildMissionRecord = {
  businessBuildMissionId: string;
  timestamp: string;
  originalCommand: string;
  businessType: BusinessType | string;
  missionObjective: string;
  expectedBusinessOutput: string;
  currentStatus: MissionStatus | string;
  requiredNextStep: RequiredNextStep | string;
  approvalStatus: ApprovalStatus | string;
  traceabilityReference: string;
  metadataVersion: string;
  missionVersion: string;
  preparedForQ2Workers: true;
  neverInterpretDetailedBusinessStrategy: true;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverAssignWorkers: true;
  neverExecuteBusinesses: true;
  neverLaunchBusinesses: true;
  neverImplementQ202OrLater: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type EmpireBuilderFactoryInput = {
  businessBuildMissionId?: string | null;
  originalCommand?: string | null;
  businessType?: BusinessType | string | null;
  missionObjective?: string | null;
  expectedBusinessOutput?: string | null;
  currentStatus?: MissionStatus | string | null;
  requiredNextStep?: RequiredNextStep | string | null;
  approvalStatus?: ApprovalStatus | string | null;
  traceabilityReference?: string | null;
  grandKingCommandId?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  interpretDetailedBusinessStrategy?: boolean;
  generateBusinessModels?: boolean;
  researchMarkets?: boolean;
  assignWorkers?: boolean;
  executeBusinesses?: boolean;
  launchBusinesses?: boolean;
  implementQ202OrLater?: boolean;
};

export type EmpireBuilderFactoryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderFactoryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EBF-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EmpireBuilderFactoryCapability[];
  totalMissions: number;
  lastBusinessType: BusinessType | string | null;
  lastMissionId: string | null;
  metadataVersion: string;
};

export type EmpireBuilderFactoryCatalog = {
  missionVersion: string;
  businessTypes: string[];
  missions: BusinessBuildMissionRecord[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverInterpretDetailedBusinessStrategy: true;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverAssignWorkers: true;
  neverExecuteBusinesses: true;
  neverLaunchBusinesses: true;
  neverImplementQ202OrLater: true;
};

export type EmpireBuilderFactoryRunReport = {
  factoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "accept_command"
    | "create_mission"
    | "classify_business_type"
    | "prepare_mission"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: EmpireBuilderFactoryEngineRecord;
  catalog: EmpireBuilderFactoryCatalog | null;
  missions: BusinessBuildMissionRecord[];
  latestMission: BusinessBuildMissionRecord | null;
  validation: EmpireBuilderFactoryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderFactoryCoreState = {
  engineVersion: "PILLOW-EBF-001";
  missionId: "Q2-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpireBuilderFactoryCoreConfiguration;
  latestReport: EmpireBuilderFactoryRunReport | null;
  engineRecord: EmpireBuilderFactoryEngineRecord | null;
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

export type EmpireBuilderFactoryCockpitSnapshot = {
  missionId: "Q2-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestMissionId: string | null;
  neverInterpretDetailedBusinessStrategy: true;
  neverGenerateBusinessModels: true;
  neverResearchMarkets: true;
  neverAssignWorkers: true;
  neverExecuteBusinesses: true;
  neverLaunchBusinesses: true;
  neverImplementQ202OrLater: true;
};
