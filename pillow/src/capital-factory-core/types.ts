import type { CapitalFactoryCoreConfiguration } from "./configuration.js";
import type {
  CAPFC_CAPABILITIES,
  CAPITAL_CATEGORIES,
  CAPITAL_WORKER_ROLES,
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
export type CapitalCategory = (typeof CAPITAL_CATEGORIES)[number];
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type WorkerStatus = (typeof WORKER_STATUSES)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type CapitalWorkerRole = (typeof CAPITAL_WORKER_ROLES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CapitalFactoryCoreCapability = (typeof CAPFC_CAPABILITIES)[number];

export type WorkerStatusMatrixEntry = {
  workerRole: CapitalWorkerRole | string;
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

export type CapitalFactoryCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CapitalAllocationSummary = {
  capitalBusinessId: string;
  capitalCategory: string;
  region: string;
  lifecycleStatus: string;
  allocationNotes: string[];
  fabricated: false;
  evidencePresent: boolean;
};

/** Machine-readable Capital Project record (Q9-01). Orchestration only. */
export type CapitalProject = {
  factoryProjectId: string;
  capitalProjectId: string;
  capitalBusinessId: string;
  timestamp: string;
  financialPeriod: string;
  capitalProjectName: string;
  capitalCategory: CapitalCategory | string;
  capitalStatus: string;
  region: string;
  capitalObjective: string;
  lifecycleStatus: LifecycleStatus | string;
  currentStatus: ProjectStatus | string;
  workerStatusMatrix: WorkerStatusMatrixEntry[];
  dependencyGraph: WorkerDependencyEdge[];
  capitalAllocationSummary: CapitalAllocationSummary;
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
  neverPerformAccounting: true;
  neverForecastFinances: true;
  neverExecuteInvestmentsAutomatically: true;
  neverFabricateFinancialStatus: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ902OrLater: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Machine-readable Capital Factory Report (Q9-01). */
export type CapitalFactoryReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string;
  financialPeriod: string;
  capitalStatus: string;
  capitalBusinessId: string;
  capitalProjectName: string;
  lifecycleStatus: LifecycleStatus | string;
  workerStatusMatrix: WorkerStatusMatrixEntry[];
  capitalAllocationSummary: CapitalAllocationSummary;
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
  capitalCategory: CapitalCategory | string;
  metadata: Record<string, string>;
  dependencyGraph: WorkerDependencyEdge[];
  progressSummary: ProgressSummary;
  validation: CapitalFactoryCoreValidationReport | null;
  runTimestamp: string;
  consumableByQ902: boolean;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveFactoryAuditHistory: true;
  neverPerformAccounting: true;
  neverForecastFinances: true;
  neverExecuteInvestmentsAutomatically: true;
  neverFabricateFinancialStatus: true;
  neverFabricateWorkerStatus: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ902OrLater: true;
};

export type CapfcInput = {
  factoryProjectId?: string | null;
  capitalBusinessId?: string | null;
  capitalProjectName?: string | null;
  capitalCategory?: CapitalCategory | string | null;
  niche?: CapitalCategory | string | null;
  region?: string | null;
  capitalObjective?: string | null;
  financialPeriod?: string | null;
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
  performAccounting?: boolean;
  forecastFinances?: boolean;
  executeInvestmentsAutomatically?: boolean;
  fabricateWorkerStatus?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ902OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CapitalFactoryCoreCatalog = {
  projectVersion: string;
  reportVersion: string;
  workerId: string;
  capitalCategories: string[];
  lifecycleStatuses: string[];
  workerRoles: string[];
  projects: CapitalProject[];
  reports: CapitalFactoryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPerformAccounting: true;
  neverForecastFinances: true;
  neverExecuteInvestmentsAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ902OrLater: true;
};

export type CapitalFactoryCoreEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CAPFC-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CapitalFactoryCoreCapability[];
  totalProjects: number;
  lastBusinessCategory: CapitalCategory | string | null;
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
    capitalBusinessId: string;
    capitalProjectName: string;
    readinessStatus: ReadinessStatus;
    lifecycleStatus: LifecycleStatus | string;
  }>;
};

export type Q902ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "capital-factory-core";
  missionId: "Q9-01";
  consumerMissionId: "Q9-02";
  exposedFields: string[];
  workerRoleCatalog: string[];
  lifecycleStatuses: string[];
  notes: string[];
  neverImplementQ902OrLater: true;
  structuralSignalOnly: true;
};

export type CapitalFactoryCoreRunReport = {
  capitalFactoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_capital_project"
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
    | "produce_capital_factory_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CapitalFactoryCoreEngineRecord;
  catalog: CapitalFactoryCoreCatalog | null;
  projects: CapitalProject[];
  latestProject: CapitalProject | null;
  latestReport: CapitalFactoryReport | null;
  factoryReadiness: FactoryReadinessSnapshot | null;
  integrations: IntegrationHandshake[];
  validation: CapitalFactoryCoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CapitalFactoryCoreState = {
  engineVersion: "PILLOW-CAPFC-001";
  missionId: "Q9-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: CapitalFactoryCoreConfiguration;
  latestReport: CapitalFactoryCoreRunReport | null;
  engineRecord: CapitalFactoryCoreEngineRecord | null;
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

export type CapitalFactoryCoreCockpitSnapshot = {
  missionId: "Q9-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalProjects: number;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverPerformAccounting: true;
  neverForecastFinances: true;
  neverExecuteInvestmentsAutomatically: true;
  neverFabricateWorkerStatus: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ902OrLater: true;
};
