import type { WorkerMonitoringConfiguration } from "./configuration.js";
import type {
  DRIFT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  MONITORING_DECISIONS,
  MONITORING_EVENTS,
  MONITORING_RULES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WMO_CAPABILITIES,
  WORKER_HEALTH_STATES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type WorkerHealthState = (typeof WORKER_HEALTH_STATES)[number];
export type MonitoringEvent = (typeof MONITORING_EVENTS)[number];
export type MonitoringDecision = (typeof MONITORING_DECISIONS)[number];
export type MonitoringRule = (typeof MONITORING_RULES)[number];
export type DriftStatus = (typeof DRIFT_STATUSES)[number];
export type WorkerMonitoringCapability = (typeof WMO_CAPABILITIES)[number];

export type MonitoringAlert = {
  alertId: string;
  severity: "info" | "warning" | "critical";
  event: MonitoringEvent | string;
  message: string;
  reportedToPillow: true;
  timestamp: string;
};

/** Observed worker under continuous monitoring (observe/report only). */
export type MonitoredWorker = {
  workerId: string;
  workerName: string;
  department: string;
  currentMission: string | null;
  available: boolean;
  active: boolean;
  progress: number;
  currentWorkload: number;
  errorCount: number;
  repeatedErrorCount: number;
  executionTimeMs: number;
  expectedExecutionTimeMs: number;
  resourceUsage: number;
  qualityScore: number;
  performanceScore: number;
  lastHeartbeatAt: string;
  stallThresholdMs: number;
  neverExecuteWorkerTasks: true;
};

/** Machine-readable Worker Monitoring Record (Q1-10). */
export type MonitoringRecord = {
  monitoringId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  department: string;
  currentMission: string | null;
  healthStatus: WorkerHealthState | string;
  availability: boolean;
  progress: number;
  currentWorkload: number;
  errorCount: number;
  driftStatus: DriftStatus | string;
  runtimeHealth: WorkerHealthState | string;
  performanceScore: number;
  alerts: MonitoringAlert[];
  metadataVersion: string;
  events: Array<MonitoringEvent | string>;
  neverExecuteWorkerTasks: true;
  neverRestartWorkersAutomatically: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveMonitoringHistory: true;
  supportsExecutiveReportingRuntime: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerMonitoringCatalog = {
  monitoringVersion: string;
  healthStates: string[];
  monitoringEvents: string[];
  workers: MonitoredWorker[];
  records: MonitoringRecord[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverRestartWorkersAutomatically: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  supportsExecutiveReportingRuntime: true;
};

export type WorkerMonitoringInput = {
  monitoringId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  department?: string | null;
  currentMission?: string | null;
  available?: boolean | null;
  active?: boolean | null;
  progress?: number | null;
  currentWorkload?: number | null;
  errorCount?: number | null;
  repeatedErrorCount?: number | null;
  executionTimeMs?: number | null;
  expectedExecutionTimeMs?: number | null;
  resourceUsage?: number | null;
  qualityScore?: number | null;
  performanceScore?: number | null;
  lastHeartbeatAt?: string | null;
  event?: MonitoringEvent | string | null;
  workers?: MonitoredWorker[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  restartWorkersAutomatically?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerMonitoringValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerMonitoringEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WMO-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerMonitoringCapability[];
  totalWorkers: number;
  totalRecords: number;
  totalAlerts: number;
  lastMonitoringDecision: MonitoringDecision | string | null;
  metadataVersion: string;
};

export type WorkerMonitoringRunReport = {
  monitoringRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_worker"
    | "observe"
    | "scan_active"
    | "detect_anomalies"
    | "generate_alerts"
    | "record_event"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerMonitoringEngineRecord;
  catalog: WorkerMonitoringCatalog | null;
  workers: MonitoredWorker[];
  records: MonitoringRecord[];
  latestRecord: MonitoringRecord | null;
  alerts: MonitoringAlert[];
  anomalies: MonitoringRecord[];
  monitoringDecision: MonitoringDecision | string | null;
  rulesFailed: string[];
  validation: WorkerMonitoringValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerMonitoringState = {
  engineVersion: "PILLOW-WMO-001";
  missionId: "Q1-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerMonitoringConfiguration;
  latestReport: WorkerMonitoringRunReport | null;
  engineRecord: WorkerMonitoringEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalRecords: number;
    totalAlerts: number;
    lastMonitoringDecision: MonitoringDecision | string | null;
    notes: string[];
  };
};

export type WorkerMonitoringCockpitSnapshot = {
  missionId: "Q1-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalWorkers: number;
  totalRecords: number;
  totalAlerts: number;
  latestMonitoringId: string | null;
  neverExecuteWorkerTasks: true;
  neverRestartWorkersAutomatically: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
