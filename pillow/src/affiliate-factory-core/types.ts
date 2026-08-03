import type { AffiliateFactoryCoreConfiguration } from "./configuration.js";
import type {
  AFC_CAPABILITIES,
  AFFILIATE_NICHES,
  AFFILIATE_WORKER_ROLES,
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LIFECYCLE_STATUSES,
  OPERATIONAL_STATES,
  PROJECT_STATUSES,
  READINESS_STATUSES,
  VALIDATION_STATUSES,
  WORKER_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AffiliateNiche = (typeof AFFILIATE_NICHES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type WorkerStatus = (typeof WORKER_STATUSES)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type AffiliateWorkerRole = (typeof AFFILIATE_WORKER_ROLES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type AffiliateFactoryCoreCapability = (typeof AFC_CAPABILITIES)[number];

export type WorkerStatusMatrixEntry = {
  workerRole: AffiliateWorkerRole | string;
  workerId: string | null;
  status: WorkerStatus;
  notes: string;
};

export type WorkerDependencyEdge = {
  fromRole: string;
  toRole: string;
  dependencyType: string;
  notes: string;
};

export type ProgressSummary = {
  stagesCompleted: number;
  totalStages: number;
  percentComplete: number;
  workersReady: number;
  workersTotal: number;
};

export type AffiliateFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** Machine-readable Affiliate Business Project record (Q8-01). Orchestration only. */
export type AffiliateBusinessProject = {
  factoryProjectId: string;
  affiliateBusinessId: string;
  timestamp: string;
  businessName: string;
  businessCategory: AffiliateNiche | string;
  region: string;
  businessObjective: string;
  lifecycleStatus: LifecycleStatus | string;
  currentStatus: ProjectStatus | string;
  workerStatusMatrix: WorkerStatusMatrixEntry[];
  dependencyGraph: WorkerDependencyEdge[];
  readinessStatus: ReadinessStatus;
  outstandingTasks: string[];
  risks: string[];
  executiveSummary: string;
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadata: Record<string, string>;
  progressSummary: ProgressSummary;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  metadataVersion: string;
  projectVersion: string;
  workerId: string;
  neverDiscoverAffiliateProgrammes: true;
  neverGenerateAffiliateContent: true;
  neverLaunchBusinessesAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ802OrLater: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Affiliate Factory Report (Q8-01). */
export type AffiliateFactoryReport = {
  reportId: string;
  timestamp: string;
  affiliateBusinessId: string;
  businessName: string;
  lifecycleStatus: LifecycleStatus | string;
  workerStatusMatrix: WorkerStatusMatrixEntry[];
  readinessStatus: ReadinessStatus;
  outstandingTasks: string[];
  risks: string[];
  executiveSummary: string;
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  factoryId: string;
  businessCategory: AffiliateNiche | string;
  metadata: Record<string, string>;
  dependencyGraph: WorkerDependencyEdge[];
  progressSummary: ProgressSummary;
  validation: AffiliateFactoryCoreValidationReport | null;
  runTimestamp: string;
  consumableByQ802: boolean;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverDiscoverAffiliateProgrammes: true;
  neverGenerateAffiliateContent: true;
  neverLaunchBusinessesAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ802OrLater: true;
};

export type AfcInput = {
  factoryProjectId?: string | null;
  affiliateBusinessId?: string | null;
  businessName?: string | null;
  businessCategory?: AffiliateNiche | string | null;
  niche?: AffiliateNiche | string | null;
  region?: string | null;
  businessObjective?: string | null;
  metadata?: Record<string, string> | null;
  workerRoles?: string[] | null;
  assignedWorkers?: string[] | null;
  workerStatusUpdates?: Array<{
    workerRole: string;
    workerId?: string | null;
    status?: WorkerStatus | null;
    notes?: string | null;
  }> | null;
  dependencyEdges?: Array<{
    fromRole: string;
    toRole: string;
    dependencyType?: string | null;
    notes?: string | null;
  }> | null;
  lifecycleTarget?: LifecycleStatus | string | null;
  currentLifecycleStage?: LifecycleStatus | string | null;
  outstandingTasks?: string[] | null;
  risks?: string[] | null;
  executiveSummary?: string | null;
  auditStatus?: AuditStatus | null;
  pillowCommandConfirmed?: boolean | null;
  validated?: boolean;
  missionId?: string | null;
  /** Forbidden boundary attempts — always rejected. */
  discoverAffiliateProgrammes?: boolean;
  generateAffiliateContent?: boolean;
  launchBusinessesAutomatically?: boolean;
  fabricateWorkerStatus?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ802OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type AffiliateFactoryCoreCatalog = {
  projectVersion: string;
  reportVersion: string;
  workerId: string;
  affiliateNiches: string[];
  lifecycleStatuses: string[];
  workerRoles: string[];
  projects: AffiliateBusinessProject[];
  reports: AffiliateFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverDiscoverAffiliateProgrammes: true;
  neverGenerateAffiliateContent: true;
  neverLaunchBusinessesAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ802OrLater: true;
};

export type AffiliateFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AFC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AffiliateFactoryCoreCapability[];
  totalProjects: number;
  lastBusinessCategory: AffiliateNiche | string | null;
  lastProjectId: string | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type FactoryReadinessSnapshot = {
  totalProjects: number;
  readinessBreakdown: Record<ReadinessStatus, number>;
  overallReadiness: ReadinessStatus;
  projects: Array<{
    affiliateBusinessId: string;
    businessName: string;
    readinessStatus: ReadinessStatus;
    lifecycleStatus: LifecycleStatus | string;
  }>;
};

export type Q802ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "affiliate-factory-core";
  missionId: "Q8-01";
  consumerMissionId: "Q8-02";
  exposedFields: string[];
  workerRoleCatalog: string[];
  lifecycleStatuses: string[];
  notes: string[];
  neverImplementQ802OrLater: true;
  structuralSignalOnly: true;
};

export type AffiliateFactoryCoreRunReport = {
  affiliateFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_affiliate_business_project"
    | "coordinate_lifecycle"
    | "track_project_status"
    | "track_project_progress"
    | "coordinate_workers"
    | "assign_workers"
    | "manage_worker_dependencies"
    | "maintain_business_metadata"
    | "monitor_factory_readiness"
    | "produce_executive_summary"
    | "produce_report"
    | "produce_affiliate_factory_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: AffiliateFactoryCoreEngineRecord;
  catalog: AffiliateFactoryCoreCatalog | null;
  projects: AffiliateBusinessProject[];
  latestProject: AffiliateBusinessProject | null;
  latestReport: AffiliateFactoryReport | null;
  factoryReadiness: FactoryReadinessSnapshot | null;
  integrations: IntegrationHandshake[];
  validation: AffiliateFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AffiliateFactoryCoreState = {
  engineVersion: "PILLOW-AFC-001";
  missionId: "Q8-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: AffiliateFactoryCoreConfiguration;
  latestReport: AffiliateFactoryCoreRunReport | null;
  engineRecord: AffiliateFactoryCoreEngineRecord | null;
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

export type AffiliateFactoryCoreCockpitSnapshot = {
  missionId: "Q8-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalProjects: number;
  latestAffiliateBusinessId: string | null;
  workerId: string;
  neverDiscoverAffiliateProgrammes: true;
  neverGenerateAffiliateContent: true;
  neverLaunchBusinessesAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ802OrLater: true;
};
