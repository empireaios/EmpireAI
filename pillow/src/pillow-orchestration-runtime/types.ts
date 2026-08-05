import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXECUTION_STATUSES,
  INTEGRATION_TARGETS,
  INVOCATION_KINDS,
  OPERATIONAL_STATES,
  ORCHESTRATION_SERVICES,
  POR_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type InvocationKind = (typeof INVOCATION_KINDS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type OrchestrationServiceName = (typeof ORCHESTRATION_SERVICES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type PorCapability = (typeof POR_CAPABILITIES)[number];

export type WorkerInvocationDescriptor = {
  workerId: string;
  factoryKey: string;
  action: string;
};

export type ToolInvocationDescriptor = {
  toolId: string;
  action: string;
};

export type WorkflowStepDescriptor = {
  stepId: string;
  kind: InvocationKind | string;
  targetId: string;
  action: string;
};

export type WorkflowInvocationDescriptor = {
  workflowId: string;
  steps: WorkflowStepDescriptor[];
};

export type ApprovalRequestDescriptor = {
  approvalId: string;
  kind: string;
  requiresGrandKingApproval?: boolean;
};

export type ReportRequestDescriptor = {
  reportType: string;
};

export type CrossFactoryRouteDescriptor = {
  sourceFactory: string;
  targetFactory: string;
  service: string;
};

export type InvocationRequest = {
  invocationId: string;
  kind: InvocationKind;
  sessionId: string;
  requestId: string;
  timestamp: string;
  descriptor: Record<string, unknown>;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverFabricateExecutionResults: true;
};

export type InvocationResult = {
  invocationId: string;
  kind: InvocationKind;
  status: ExecutionStatus;
  timestamp: string;
  handlerInvoked: boolean;
  fabricated: false;
  evidence: string[];
  notes: string[];
  metadataVersion: string;
  neverReplaceWorkerImplementations?: true;
  neverReplaceToolImplementations?: true;
  structuralSignalOnly: true;
};

export type ApprovalAction = {
  actionId: string;
  approvalId: string;
  kind: string;
  status: ExecutionStatus;
  routedAt: string;
  requiresGrandKingApproval: boolean;
  grandKingApproved: boolean;
  handlerInvoked: boolean;
  notes: string[];
  metadataVersion: string;
};

export type ExecutionTimelineEntry = {
  entryId: string;
  timestamp: string;
  kind: InvocationKind | "cross_factory" | "session" | "validation";
  label: string;
  status: ExecutionStatus | string;
  notes: string[];
};

export type OrchestrationSession = {
  sessionId: string;
  requestId: string;
  capitalBusinessId: string | null;
  createdAt: string;
  updatedAt: string;
  status: OperationalState | string;
  executionContextId: string | null;
  traceabilityRefs: string[];
  metadataVersion: string;
  structuralSignalOnly: true;
};

export type OrchestrationReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  sessionId: string;
  requestId: string;
  invokedWorkers: InvocationResult[];
  invokedTools: InvocationResult[];
  invokedWorkflows: InvocationResult[];
  approvalActions: ApprovalAction[];
  reportsGenerated: InvocationResult[];
  executionTimeline: ExecutionTimelineEntry[];
  runtimeState: OperationalState | string;
  successFailureStatus: "success" | "partial" | "failure";
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1003: boolean;
  neverReplaceWorkerImplementations: true;
  neverReplaceToolImplementations: true;
  neverExecuteUnauthorisedActions: true;
  neverFabricateExecutionResults: true;
  neverBypassApprovalRuntime: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1003OrLater: true;
  preserveCompleteTraceability: true;
  preserveOrchestrationHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1003ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "pillow-orchestration-runtime";
  missionId: "Q10-02";
  consumerMissionId: "Q10-03";
  exposedFields: string[];
  orchestrationServiceCatalog: string[];
  invocationKindCatalog: string[];
  executionStatusCatalog: string[];
  notes: string[];
  neverImplementQ1003OrLater: true;
  structuralSignalOnly: true;
};

export type PorInput = {
  sessionId?: string;
  requestId?: string;
  capitalBusinessId?: string;
  workers?: WorkerInvocationDescriptor[];
  tools?: ToolInvocationDescriptor[];
  workflows?: WorkflowInvocationDescriptor[];
  approvalRequests?: ApprovalRequestDescriptor[];
  reportRequests?: ReportRequestDescriptor[];
  crossFactoryRoute?: CrossFactoryRouteDescriptor;
  validated?: boolean;
  forceFail?: boolean;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  fabricateSuccess?: boolean;
  replaceWorkerLogic?: boolean;
  replaceToolLogic?: boolean;
  executeUnauthorisedActions?: boolean;
  bypassApprovalRuntime?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1003OrLater?: boolean;
  missionId?: string | null;
};

export type PorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PorRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: PorValidationReport;
  orchestrationReport: OrchestrationReport | null;
  session: OrchestrationSession | null;
  invocationResults: InvocationResult[];
  approvalActions: ApprovalAction[];
  executionTimeline: ExecutionTimelineEntry[];
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type PorEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  totalSessions: number;
  totalInvocations: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: PorCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PorDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalSessions: number;
  totalInvocations: number;
  totalEvents: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type PillowOrchestrationRuntimeState = {
  engineVersion: "PILLOW-POR-001";
  missionId: "Q10-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: PillowOrchestrationRuntimeConfiguration;
  latestReport: PorRunReport | null;
  engineRecord: PorEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalSessions: number;
    totalInvocations: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type PillowOrchestrationRuntimeCockpitSnapshot = {
  missionId: "Q10-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalSessions: number;
  totalInvocations: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceWorkerImplementations: true;
  neverReplaceToolImplementations: true;
  neverExecuteUnauthorisedActions: true;
  neverFabricateExecutionResults: true;
  neverBypassApprovalRuntime: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1003OrLater: true;
  structuralSignalOnly: true;
};
