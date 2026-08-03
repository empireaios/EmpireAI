import type { LocalBusinessFactoryCoreConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  BUSINESS_CATEGORIES,
  CUSTOMER_ACQUISITION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LAUNCH_READINESS_STATUSES,
  LBFC_CAPABILITIES,
  LIFECYCLE_STAGES,
  MISSION_STATUSES,
  OPERATIONAL_STATES,
  OPERATIONAL_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type LaunchReadinessStatus = (typeof LAUNCH_READINESS_STATUSES)[number];
export type CustomerAcquisitionStatus = (typeof CUSTOMER_ACQUISITION_STATUSES)[number];
export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LocalBusinessFactoryCoreCapability = (typeof LBFC_CAPABILITIES)[number];

/** Machine-readable Local Business Project / mission record (Q7-01). */
export type LocalBusinessProject = {
  factoryMissionId: string;
  businessProjectId: string;
  timestamp: string;
  businessCategory: BusinessCategory | string;
  businessName: string;
  businessObjective: string;
  currentLifecycleStage: LifecycleStage | string;
  currentStatus: MissionStatus | string;
  assignedWorkers: string[];
  assignedWorkerRoles: string[];
  approvalStatus: ApprovalStatus | string;
  launchReadiness: LaunchReadinessStatus | string;
  customerAcquisitionStatus: CustomerAcquisitionStatus | string;
  operationalStatus: OperationalStatus | string;
  outstandingIssues: string[];
  executiveSummary: string;
  confidenceScore: number;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  preservedDecisions: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
  missionVersion: string;
  workerId: string;
  neverPerformSpecialistWorkerFunctions: true;
  neverReplaceQ7Workers: true;
  neverModifyUnrelatedFactories: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateOperationalStatus: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ702OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Local Business Factory Report (Q7-01). */
export type LocalBusinessFactoryReport = {
  factoryId: string;
  timestamp: string;
  businessProjectId: string;
  businessCategory: BusinessCategory | string;
  businessName: string;
  currentLifecycleStage: LifecycleStage | string;
  assignedWorkers: string[];
  launchReadiness: LaunchReadinessStatus | string;
  customerAcquisitionStatus: CustomerAcquisitionStatus | string;
  operationalStatus: OperationalStatus | string;
  outstandingIssues: string[];
  executiveSummary: string;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  factoryMissionId: string;
  approvalStatus: ApprovalStatus | string;
  missionCoordinationRef: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  assignedWorkerRoles: string[];
  preservedDecisions: string[];
  traceabilityRefs: string[];
  neverPerformSpecialistWorkerFunctions: true;
  neverReplaceQ7Workers: true;
  neverModifyUnrelatedFactories: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateOperationalStatus: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ702OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type LocalBusinessFactoryCoreInput = {
  factoryMissionId?: string | null;
  businessProjectId?: string | null;
  businessCategory?: BusinessCategory | string | null;
  businessName?: string | null;
  businessObjective?: string | null;
  currentLifecycleStage?: LifecycleStage | string | null;
  assignedWorkers?: string[] | null;
  assignedWorkerRoles?: string[] | null;
  approvalStatus?: ApprovalStatus | string | null;
  launchReadiness?: LaunchReadinessStatus | string | null;
  customerAcquisitionStatus?: CustomerAcquisitionStatus | string | null;
  operationalStatus?: OperationalStatus | string | null;
  outstandingIssues?: string[] | null;
  executiveSummary?: string | null;
  grandKingApproved?: boolean | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  performSpecialistWork?: boolean;
  replaceQ7Workers?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  fabricateOperationalStatus?: boolean;
  implementQ702OrLater?: boolean;
  modifyUnrelatedFactories?: boolean;
  overrideApprovedArchitecture?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LocalBusinessFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocalBusinessFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LBFC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocalBusinessFactoryCoreCapability[];
  totalProjects: number;
  lastBusinessCategory: BusinessCategory | string | null;
  lastProjectId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LocalBusinessFactoryCoreCatalog = {
  missionVersion: string;
  reportVersion: string;
  workerId: string;
  businessCategories: string[];
  lifecycleStages: string[];
  projects: LocalBusinessProject[];
  reports: LocalBusinessFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPerformSpecialistWorkerFunctions: true;
  neverReplaceQ7Workers: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateOperationalStatus: true;
  neverImplementQ702OrLater: true;
};

export type LocalBusinessFactoryCoreRunReport = {
  localBusinessFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_local_business_project"
    | "coordinate_lifecycle"
    | "track_project_progress"
    | "coordinate_workers"
    | "assign_workers"
    | "coordinate_approval"
    | "coordinate_launch_readiness"
    | "coordinate_customer_acquisition"
    | "coordinate_fulfilment"
    | "coordinate_ongoing_operations"
    | "produce_report"
    | "produce_local_business_factory_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LocalBusinessFactoryCoreEngineRecord;
  catalog: LocalBusinessFactoryCoreCatalog | null;
  projects: LocalBusinessProject[];
  latestProject: LocalBusinessProject | null;
  latestReport: LocalBusinessFactoryReport | null;
  integrations: IntegrationHandshake[];
  validation: LocalBusinessFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LocalBusinessFactoryCoreState = {
  engineVersion: "PILLOW-LBFC-001";
  missionId: "Q7-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalBusinessFactoryCoreConfiguration;
  latestReport: LocalBusinessFactoryCoreRunReport | null;
  engineRecord: LocalBusinessFactoryCoreEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalProjects: number;
    lastProjectId: string | null;
    notes: string[];
  };
};

export type LocalBusinessFactoryCoreCockpitSnapshot = {
  missionId: "Q7-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalProjects: number;
  latestProjectId: string | null;
  workerId: string;
  neverPerformSpecialistWorkerFunctions: true;
  neverReplaceQ7Workers: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateOperationalStatus: true;
  neverImplementQ702OrLater: true;
};
