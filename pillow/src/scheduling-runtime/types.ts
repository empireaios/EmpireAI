import type { SchedulingRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  SCHEDULE_STATUSES,
  SCHEDULE_TYPES,
  SCHRT_CAPABILITIES,
  TRIGGER_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type ScheduleType = (typeof SCHEDULE_TYPES)[number];
export type TriggerType = (typeof TRIGGER_TYPES)[number];
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SchrtCapability = (typeof SCHRT_CAPABILITIES)[number];

export type ExecutionWindow = {
  startUtc: string;
  endUtc: string;
};

export type RetryPolicy = {
  maxRetries: number;
  backoffMs: number;
};

export type ScheduleDefinition = {
  scheduleId: string;
  missionId: string;
  workerId: string;
  factoryId: string;
  scheduleType: ScheduleType;
  triggerType: TriggerType;
  timeZone: string;
  executionWindow: ExecutionWindow | null;
  cronExpression: string | null;
  eventKey: string | null;
  nextExecution: string | null;
  previousExecution: string | null;
  currentStatus: ScheduleStatus;
  retryPolicy: RetryPolicy;
  priority: number;
  paused: boolean;
  pillowConfirmed: boolean;
  grandKingApproved: boolean;
  highRisk: boolean;
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type ScheduleExecution = {
  executionId: string;
  scheduleId: string;
  missionId: string;
  workerId: string;
  factoryId: string;
  scheduledFor: string;
  executedAt: string;
  status: "triggered" | "completed" | "missed" | "conflicted" | "awaiting_approval";
  triggerRef: string | null;
  queueRef: string | null;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type ConflictRecord = {
  conflictId: string;
  scheduleIds: string[];
  missionId: string;
  workerId: string;
  windowStartUtc: string;
  windowEndUtc: string;
  detectedAt: string;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type EventTriggerRecord = {
  eventTriggerId: string;
  eventKey: string;
  scheduleId: string;
  triggeredAt: string;
  status: "matched" | "triggered" | "ignored";
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type SchedulingStatistics = {
  totalSchedules: number;
  activeCount: number;
  pausedCount: number;
  completedCount: number;
  cancelledCount: number;
  missedCount: number;
  conflictedCount: number;
  totalExecutions: number;
  totalEventTriggers: number;
  totalConflicts: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type ConflictSummary = {
  totalConflicts: number;
  openConflicts: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type SchedulingMetrics = {
  totalSchedules: number;
  activeSchedules: number;
  totalExecutions: number;
  completedExecutions: number;
  missedExecutions: number;
  totalConflicts: number;
  totalEventTriggers: number;
  totalReports: number;
};

export type SchedulingRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  activeSchedules: ScheduleDefinition[];
  upcomingExecutions: ScheduleDefinition[];
  completedExecutions: ScheduleExecution[];
  missedExecutions: ScheduleExecution[];
  eventTriggers: EventTriggerRecord[];
  schedulingStatistics: SchedulingStatistics;
  conflictSummary: ConflictSummary;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1013: boolean;
  neverFabricateExecutionTimes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverReplaceQueueRuntime: true;
  neverReplaceMissionRuntime: true;
  neverExecuteUnauthorizedWork: true;
  neverImplementQ1013OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveSchedulingHistory: true;
  preserveAuditHistory: true;
  deterministicSchedulingBehaviour: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1013ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "scheduling-runtime";
  missionId: "Q10-12";
  consumerMissionId: "Q10-13";
  exposedFields: string[];
  scheduleTypeCatalog: string[];
  triggerTypeCatalog: string[];
  scheduleStatusCatalog: string[];
  notes: string[];
  neverImplementQ1013OrLater: true;
  structuralSignalOnly: true;
};

export type SchrtInput = {
  scheduleId?: string;
  missionId?: string | null;
  workerId?: string;
  factoryId?: string;
  scheduleType?: ScheduleType;
  triggerType?: TriggerType;
  timeZone?: string;
  executionWindow?: ExecutionWindow | null;
  cronExpression?: string | null;
  eventKey?: string | null;
  nextExecution?: string | null;
  previousExecution?: string | null;
  currentStatus?: ScheduleStatus;
  retryPolicy?: RetryPolicy;
  priority?: number;
  paused?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  highRisk?: boolean;
  auditReference?: string;
  now?: string;
  validated?: boolean;
  forceFail?: boolean;
  exposeSecrets?: boolean;
  fabricateExecutionTimes?: boolean;
  fabricateTimes?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  replaceQueueRuntime?: boolean;
  replaceMissionRuntime?: boolean;
  executeUnauthorizedWork?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1013OrLater?: boolean;
  targetMissionId?: string | null;
  businessPayload?: unknown;
  maintenanceWindows?: ExecutionWindow[];
};

export type SchrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SchrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: SchrtValidationReport;
  schedule: ScheduleDefinition | null;
  schedules: ScheduleDefinition[];
  execution: ScheduleExecution | null;
  executions: ScheduleExecution[];
  conflict: ConflictRecord | null;
  conflicts: ConflictRecord[];
  eventTrigger: EventTriggerRecord | null;
  eventTriggers: EventTriggerRecord[];
  schedulingRuntimeReport: SchedulingRuntimeReport | null;
  q1013Contract: Q1013ConsumableContract | null;
  integrationHandshakes: IntegrationHandshake[];
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type SchrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalSchedules: number;
  totalExecutions: number;
  totalConflicts: number;
  totalEventTriggers: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: SchrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SchrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalSchedules: number;
  totalExecutions: number;
  totalConflicts: number;
  totalEventTriggers: number;
  totalReports: number;
  activeSchedules: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type SchedulingRuntimeState = {
  engineVersion: "PILLOW-SCHRT-001";
  missionId: "Q10-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: SchedulingRuntimeConfiguration;
  latestReport: SchrtRunReport | null;
  engineRecord: SchrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalSchedules: number;
    totalExecutions: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type SchedulingRuntimeCockpitSnapshot = {
  missionId: "Q10-12";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalSchedules: number;
  totalExecutions: number;
  activeSchedules: number;
  completedExecutions: number;
  conflictCount: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateExecutionTimes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverReplaceQueueRuntime: true;
  neverReplaceMissionRuntime: true;
  neverExecuteUnauthorizedWork: true;
  neverImplementQ1013OrLater: true;
  structuralSignalOnly: true;
};
