import type { QueueRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  JOB_STATUSES,
  QRT_CAPABILITIES,
  QUEUE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type QueueType = (typeof QUEUE_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type QrtCapability = (typeof QRT_CAPABILITIES)[number];

export type QueueDefinition = {
  queueId: string;
  queueName: string;
  queueType: QueueType;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
  maxRetries: number;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type QueueJob = {
  jobId: string;
  queueId: string;
  queueName: string;
  jobPayloadRef: string;
  priority: number;
  scheduledAt: string | null;
  enqueuedAt: string;
  updatedAt: string;
  status: JobStatus;
  dependencyJobIds: string[];
  retryCount: number;
  maxRetries: number;
  highRisk: boolean;
  pillowConfirmed: boolean;
  grandKingApproved: boolean;
  traceabilityRefs: string[];
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type DispatchRecord = {
  dispatchId: string;
  jobId: string;
  queueId: string;
  queueName: string;
  timestamp: string;
  priority: number;
  businessLogicExecuted: false;
  structuralSignalOnly: true;
  highRisk: boolean;
  grandKingApproved: boolean;
  metadataVersion: string;
};

export type RetrySummary = {
  totalRetries: number;
  jobsRetried: number;
  jobsDeadLettered: number;
  maxRetriesObserved: number;
};

export type DependencySummary = {
  totalDependencies: number;
  satisfiedDependencies: number;
  blockedJobs: number;
  readyJobs: number;
};

export type QueueHealth = {
  status: EngineHealthStatus;
  healthScore: number;
  pausedQueues: number;
  activeQueues: number;
  backlogSize: number;
  notes: string[];
};

export type QueueRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  queueInventory: QueueDefinition[];
  activeJobs: QueueJob[];
  waitingJobs: QueueJob[];
  runningJobs: QueueJob[];
  completedJobs: QueueJob[];
  failedJobs: QueueJob[];
  retrySummary: RetrySummary;
  dependencySummary: DependencySummary;
  queueHealth: QueueHealth;
  dispatchStatistics: {
    totalDispatches: number;
    lastDispatchAt: string | null;
    highRiskDispatches: number;
  };
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1005: boolean;
  neverReplaceWorkerLogic: true;
  neverReplaceMissionLogic: true;
  neverExecuteBusinessSpecificWork: true;
  neverFabricateQueueState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1005OrLater: true;
  preserveCompleteTraceability: true;
  preserveExecutionHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  deterministicQueueOrdering: true;
};

export type Q1005ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "queue-runtime";
  missionId: "Q10-04";
  consumerMissionId: "Q10-05";
  exposedFields: string[];
  queueTypeCatalog: string[];
  jobStatusCatalog: string[];
  notes: string[];
  neverImplementQ1005OrLater: true;
  structuralSignalOnly: true;
};

export type QrtInput = {
  queueName?: string;
  queueType?: QueueType;
  jobId?: string;
  jobPayloadRef?: string;
  priority?: number;
  scheduledAt?: string;
  dependencyJobIds?: string[];
  maxRetries?: number;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  now?: string;
  fabricateState?: boolean;
  replaceWorkerLogic?: boolean;
  replaceMissionLogic?: boolean;
  executeBusinessSpecificWork?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1005OrLater?: boolean;
  targetMissionId?: string | null;
};

export type QrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type QrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: QrtValidationReport;
  queue: QueueDefinition | null;
  job: QueueJob | null;
  dispatchRecords: DispatchRecord[];
  queueRuntimeReport: QueueRuntimeReport | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type QrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalQueues: number;
  totalJobs: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: QrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type QrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalQueues: number;
  totalJobs: number;
  totalDispatches: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type QueueRuntimeState = {
  engineVersion: "PILLOW-QRT-001";
  missionId: "Q10-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: QueueRuntimeConfiguration;
  latestReport: QrtRunReport | null;
  engineRecord: QrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalQueues: number;
    totalJobs: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type QueueRuntimeCockpitSnapshot = {
  missionId: "Q10-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalQueues: number;
  totalJobs: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceWorkerLogic: true;
  neverReplaceMissionLogic: true;
  neverExecuteBusinessSpecificWork: true;
  neverFabricateQueueState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1005OrLater: true;
  structuralSignalOnly: true;
};
