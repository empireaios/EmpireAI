import type { ToolRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  AUTH_METHODS,
  AVAILABILITY_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  TOOL_CATEGORIES,
  TOOLRT_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
export type AuthMethod = (typeof AUTH_METHODS)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ToolrtCapability = (typeof TOOLRT_CAPABILITIES)[number];

export type ToolPermissionPolicy = {
  allowedActions: string[];
  requiresPillowConfirmation: boolean;
  requiresGrandKingApproval: boolean;
  highRisk: boolean;
};

export type ToolRegistration = {
  toolId: string;
  toolName: string;
  toolCategory: ToolCategory;
  provider: string;
  version: string;
  authMethod: AuthMethod;
  credentialReference: string;
  permissionPolicy: ToolPermissionPolicy;
  connectionStatus: ConnectionStatus;
  availabilityStatus: AvailabilityStatus;
  auditReference: string;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ToolConnection = {
  connectionId: string;
  toolId: string;
  provider: string;
  status: ConnectionStatus;
  openedAt: string;
  closedAt: string | null;
  credentialReference: string;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ToolInvocationStatus =
  | "success"
  | "failed"
  | "denied"
  | "retrying"
  | "rate_limited"
  | "unavailable";

export type ToolInvocationTrace = {
  invocationId: string;
  toolId: string;
  toolName: string;
  action: string;
  requestRef: string;
  resultRef: string | null;
  status: ToolInvocationStatus;
  attempt: number;
  maxAttempts: number;
  authStatus: "authenticated" | "rejected" | "skipped" | "refresh_structural";
  permissionGranted: boolean;
  durationMs: number;
  errorClass: string | null;
  timestamp: string;
  liveExecution: boolean;
  fabricated: false;
  structuralSignalOnly: true;
  secretsExposed: false;
};

export type InvocationStatistics = {
  totalInvocations: number;
  successfulInvocations: number;
  failedInvocations: number;
  deniedInvocations: number;
  retriedInvocations: number;
  liveExecutions: number;
  structuralOnlyInvocations: number;
  lastInvocationAt: string | null;
};

export type FailureSummary = {
  totalFailures: number;
  byErrorClass: Record<string, number>;
  unavailableCount: number;
};

export type RetrySummary = {
  totalRetries: number;
  exhaustedRetries: number;
  averageAttempts: number;
};

export type PermissionStatusSummary = {
  granted: number;
  denied: number;
  highRiskApproved: number;
};

export type AvailabilitySummary = {
  available: number;
  degraded: number;
  unavailable: number;
  unknown: number;
  standby: number;
};

export type ToolDiagnostics = {
  registeredToolCount: number;
  activeConnectionCount: number;
  unavailableToolCount: number;
  notes: string[];
};

export type ToolRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  registeredTools: ToolRegistration[];
  toolCategories: string[];
  activeConnections: ToolConnection[];
  invocationStatistics: InvocationStatistics;
  failureSummary: FailureSummary;
  retrySummary: RetrySummary;
  availabilityStatus: AvailabilitySummary;
  permissionStatus: PermissionStatusSummary;
  diagnostics: ToolDiagnostics;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1008: boolean;
  neverExposeSecrets: true;
  neverExposeCredentials: true;
  neverFabricateExecutionResults: true;
  neverInvokeUnauthorizedTools: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1008OrLater: true;
  deterministicToolRoutingOnly: true;
  preserveCompleteTraceability: true;
  preserveInvocationTraces: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  credentialReferenceOnly: true;
};

export type Q1008ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "tool-runtime";
  missionId: "Q10-07";
  consumerMissionId: "Q10-08";
  exposedFields: string[];
  toolCategoryCatalog: string[];
  authMethodCatalog: string[];
  notes: string[];
  neverImplementQ1008OrLater: true;
  structuralSignalOnly: true;
};

export type ToolrtInput = {
  toolId?: string;
  toolName?: string;
  toolCategory?: ToolCategory;
  provider?: string;
  version?: string;
  authMethod?: AuthMethod;
  credentialReference?: string;
  action?: string;
  allowedActions?: string[];
  connectionId?: string;
  requestRef?: string;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricateResult?: boolean;
  exposeSecrets?: boolean;
  simulateTransientFailure?: boolean;
  refreshTokenReference?: string;
  unauthorized?: boolean;
  requiresPillowConfirmation?: boolean;
  requiresGrandKingApproval?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1008OrLater?: boolean;
  targetMissionId?: string | null;
  maxAttempts?: number;
};

export type ToolrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ToolrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: ToolrtValidationReport;
  tool: ToolRegistration | null;
  tools: ToolRegistration[];
  connection: ToolConnection | null;
  invocation: ToolInvocationTrace | null;
  invocations: ToolInvocationTrace[];
  toolRuntimeReport: ToolRuntimeReport | null;
  q1008Contract: Q1008ConsumableContract | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type ToolrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalTools: number;
  totalConnections: number;
  totalInvocations: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: ToolrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ToolrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalTools: number;
  totalConnections: number;
  totalInvocations: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type ToolRuntimeState = {
  engineVersion: "PILLOW-TOOLRT-001";
  missionId: "Q10-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: ToolRuntimeConfiguration;
  latestReport: ToolrtRunReport | null;
  engineRecord: ToolrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalTools: number;
    totalInvocations: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type ToolRuntimeCockpitSnapshot = {
  missionId: "Q10-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalTools: number;
  totalConnections: number;
  totalInvocations: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverExposeSecrets: true;
  neverFabricateExecutionResults: true;
  neverInvokeUnauthorizedTools: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1008OrLater: true;
  structuralSignalOnly: true;
};
