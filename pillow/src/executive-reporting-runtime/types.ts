import type { ExecutiveReportingRuntimeConfiguration } from "./configuration.js";
import type {
  COMPLETION_STATUSES,
  ENGINE_STATUSES,
  ENTITY_TYPES,
  ERT_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  REPORT_TYPES,
  REPORTING_FREQUENCIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ReportType = (typeof REPORT_TYPES)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];
export type ReportingFrequency = (typeof REPORTING_FREQUENCIES)[number];
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];
export type ExecutiveReportingRuntimeCapability = (typeof ERT_CAPABILITIES)[number];

/** Machine-readable Report Record (Q0-26). */
export type ReportRecord = {
  reportId: string;
  timestamp: string;
  reportingEntity: string;
  entityType: EntityType | string;
  businessId: string;
  missionId: string;
  currentStatus: string;
  progress: number;
  blockers: string[];
  risks: string[];
  evidence: string[];
  nextAction: string;
  completionStatus: CompletionStatus;
  metadataVersion: string;
  reportType: ReportType | string;
  reportingFrequency: ReportingFrequency | string;
  reportTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-26 boundaries. */
  neverExecuteWorkerLogic: true;
  neverReplaceMonitoringRuntime: true;
  neverReplaceMissionCoordination: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerLogicExecuted: false;
  monitoringRuntimeReplaced: false;
  missionCoordinationReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveReportingTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ExecutiveSummary = {
  summaryId: string;
  timestamp: string;
  businessId: string;
  missionId: string | null;
  averageProgress: number;
  totalReports: number;
  openBlockers: string[];
  openRisks: string[];
  completionBreakdown: Record<string, number>;
  entityBreakdown: Record<string, number>;
  narrative: string;
  metadataVersion: string;
};

/** Input for Q0-26 — collect/aggregate/report only. */
export type ExecutiveReportingRuntimeInput = {
  reportId?: string | null;
  reportingEntity?: string | null;
  entityType?: EntityType | string | null;
  businessId?: string | null;
  missionId?: string | null;
  currentStatus?: string | null;
  progress?: number | null;
  blockers?: string[];
  risks?: string[];
  evidence?: string[];
  nextAction?: string | null;
  completionStatus?: CompletionStatus | string | null;
  reportType?: ReportType | string | null;
  reportingFrequency?: ReportingFrequency | string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerLogic?: boolean;
  replaceMonitoringRuntime?: boolean;
  replaceMissionCoordination?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ExecutiveReportingRuntimeValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveReportingRuntimeEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ERT-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExecutiveReportingRuntimeCapability[];
  totalReportRecords: number;
  workerReports: number;
  departmentReports: number;
  factoryReports: number;
  executiveReports: number;
  openBlockerCount: number;
  averageProgress: number;
  lastReportType: ReportType | string | null;
  metadataVersion: string;
};

export type ExecutiveReportingRuntimeRunReport = {
  reportingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_worker"
    | "submit_department"
    | "submit_factory"
    | "submit_executive"
    | "aggregate_progress"
    | "list_blockers"
    | "generate_summary"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ExecutiveReportingRuntimeEngineRecord;
  records: ReportRecord[];
  summary: ExecutiveSummary | null;
  averageProgress: number | null;
  openBlockers: string[];
  validation: ExecutiveReportingRuntimeValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveReportingRuntimeState = {
  engineVersion: "PILLOW-ERT-001";
  missionId: "Q0-26";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveReportingRuntimeConfiguration;
  latestReport: ExecutiveReportingRuntimeRunReport | null;
  engineRecord: ExecutiveReportingRuntimeEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReportRecords: number;
    openBlockerCount: number;
    averageProgress: number;
    lastReportType: ReportType | string | null;
    notes: string[];
  };
};

export type ExecutiveReportingRuntimeCockpitSnapshot = {
  missionId: "Q0-26";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalReportRecords: number;
  latestReportId: string | null;
  openBlockerCount: number;
  neverExecuteWorkerLogic: true;
  neverReplaceMonitoringRuntime: true;
  neverReplaceMissionCoordination: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
