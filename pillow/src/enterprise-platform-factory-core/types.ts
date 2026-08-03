import type { EnterprisePlatformFactoryCoreConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  DEPLOYMENT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EPFC_CAPABILITIES,
  INTEGRATION_TARGETS,
  LIFECYCLE_STAGES,
  MISSION_STATUSES,
  OPERATIONAL_STATES,
  PIPELINE_STAGES,
  PIPELINE_TYPES,
  PLATFORM_TYPES,
  PRODUCTION_STATUSES,
  TESTING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type PlatformType = (typeof PLATFORM_TYPES)[number];
export type PipelineType = (typeof PIPELINE_TYPES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type TestingStatus = (typeof TESTING_STATUSES)[number];
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type EnterprisePlatformFactoryCoreCapability = (typeof EPFC_CAPABILITIES)[number];

/** Machine-readable Enterprise Platform Mission (Q6-01). */
export type EnterprisePlatformMission = {
  factoryMissionId: string;
  timestamp: string;
  platformId: string;
  platformName: string;
  businessId: string;
  businessObjective: string;
  platformPortfolio: string[];
  activePlatforms: string[];
  platformType: PlatformType | string;
  pipelineId: string | null;
  pipelineType: PipelineType | string;
  pipelineName: string | null;
  currentLifecycleStage: LifecycleStage | string;
  currentStatus: MissionStatus | string;
  assignedWorkers: string[];
  assignedWorkerRoles: string[];
  activeDependencies: string[];
  approvalStatus: ApprovalStatus | string;
  testingStatus: TestingStatus | string;
  deploymentStatus: DeploymentStatus | string;
  productionStatus: ProductionStatus | string;
  executiveSummary: string;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  missionVersion: string;
  workerId: string;
  neverBuildFrontend: true;
  neverBuildBackend: true;
  neverDesignDatabases: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ602OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Enterprise Platform Factory Report (Q6-01). */
export type EnterprisePlatformFactoryReport = {
  factoryMissionId: string;
  timestamp: string;
  platformId: string;
  platformName: string;
  businessObjective: string;
  platformPortfolio: string[];
  activePlatforms: string[];
  currentLifecycleStage: LifecycleStage | string;
  assignedWorkers: string[];
  activeDependencies: string[];
  testingStatus: TestingStatus | string;
  deploymentStatus: DeploymentStatus | string;
  executiveSummary: string;
  metadataVersion: string;
  approvalStatus: ApprovalStatus | string;
  productionStatus: ProductionStatus | string;
  missionCoordinationRef: string | null;
  executiveReportId: string | null;
  submittedToExecutiveReporting: boolean;
  assignedWorkerRoles: string[];
  pipelineId: string | null;
  pipelineType: PipelineType | string;
  platformType: PlatformType | string;
  businessId: string;
  traceabilityRefs: string[];
  preservedDecisions: string[];
  workerId: string;
  reportVersion: string;
  neverBuildFrontend: true;
  neverBuildBackend: true;
  neverDesignDatabases: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ602OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export type EnterprisePlatformFactoryCoreInput = {
  factoryMissionId?: string | null;
  platformId?: string | null;
  platformName?: string | null;
  businessId?: string | null;
  businessObjective?: string | null;
  platformPortfolio?: string[] | null;
  activePlatforms?: string[] | null;
  platformType?: PlatformType | string | null;
  pipelineId?: string | null;
  pipelineType?: PipelineType | string | null;
  pipelineName?: string | null;
  currentLifecycleStage?: LifecycleStage | string | null;
  assignedWorkers?: string[] | null;
  assignedWorkerRoles?: string[] | null;
  activeDependencies?: string[] | null;
  approvalStatus?: ApprovalStatus | string | null;
  testingStatus?: TestingStatus | string | null;
  deploymentStatus?: DeploymentStatus | string | null;
  productionStatus?: ProductionStatus | string | null;
  executiveSummary?: string | null;
  grandKingApproved?: boolean | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildFrontend?: boolean;
  buildBackend?: boolean;
  designDatabases?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ602OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type EnterprisePlatformFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EnterprisePlatformFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EPFC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EnterprisePlatformFactoryCoreCapability[];
  totalMissions: number;
  lastPlatformType: PlatformType | string | null;
  lastPipelineType: PipelineType | string | null;
  lastMissionId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type EnterprisePlatformFactoryCoreCatalog = {
  missionVersion: string;
  reportVersion: string;
  workerId: string;
  platformTypes: string[];
  pipelineTypes: string[];
  missions: EnterprisePlatformMission[];
  reports: EnterprisePlatformFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildFrontend: true;
  neverBuildBackend: true;
  neverDesignDatabases: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type EnterprisePlatformFactoryCoreRunReport = {
  enterprisePlatformFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_enterprise_platform_mission"
    | "register_software_platform"
    | "coordinate_software_development_lifecycle"
    | "coordinate_architecture_decisions"
    | "coordinate_implementation_workers"
    | "coordinate_testing_workflows"
    | "coordinate_deployment_workflows"
    | "coordinate_production_operations"
    | "track_platform_lifecycle"
    | "manage_lifecycle"
    | "coordinate_workers"
    | "coordinate_approval"
    | "produce_report"
    | "produce_enterprise_platform_factory_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: EnterprisePlatformFactoryCoreEngineRecord;
  catalog: EnterprisePlatformFactoryCoreCatalog | null;
  missions: EnterprisePlatformMission[];
  latestMission: EnterprisePlatformMission | null;
  latestReport: EnterprisePlatformFactoryReport | null;
  integrations: IntegrationHandshake[];
  validation: EnterprisePlatformFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EnterprisePlatformFactoryCoreState = {
  engineVersion: "PILLOW-EPFC-001";
  missionId: "Q6-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: EnterprisePlatformFactoryCoreConfiguration;
  latestReport: EnterprisePlatformFactoryCoreRunReport | null;
  engineRecord: EnterprisePlatformFactoryCoreEngineRecord | null;
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

export type EnterprisePlatformFactoryCoreCockpitSnapshot = {
  missionId: "Q6-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestMissionId: string | null;
  workerId: string;
  neverBuildFrontend: true;
  neverBuildBackend: true;
  neverDesignDatabases: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
