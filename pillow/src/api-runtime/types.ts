import type { ApiRuntimeConfiguration } from "./configuration.js";
import type {
  APIRT_CAPABILITIES,
  AUDIT_STATUSES,
  AUTH_METHODS,
  CIRCUIT_STATES,
  CONNECTION_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_TARGETS,
  RATE_LIMIT_STATUSES,
  SERVICE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type AuthMethod = (typeof AUTH_METHODS)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RateLimitStatus = (typeof RATE_LIMIT_STATUSES)[number];
export type CircuitState = (typeof CIRCUIT_STATES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ApirtCapability = (typeof APIRT_CAPABILITIES)[number];

export type RetryPolicy = {
  maxRetries: number;
  backoffMs: number;
  retryOnStatuses: number[];
};

export type TimeoutPolicy = {
  timeoutMs: number;
};

export type ApiProviderRegistration = {
  apiId: string;
  provider: string;
  serviceType: ServiceType;
  endpoint: string;
  authMethod: AuthMethod;
  credentialReference: string;
  apiVersion: string;
  connectionStatus: ConnectionStatus;
  healthStatus: HealthStatus;
  rateLimitStatus: RateLimitStatus;
  retryPolicy: RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
  lastSuccessfulRequest: string | null;
  lastFailedRequest: string | null;
  auditReference: string;
  circuitState: CircuitState;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ApiConnection = {
  connectionId: string;
  apiId: string;
  provider: string;
  status: ConnectionStatus;
  openedAt: string;
  closedAt: string | null;
  credentialReference: string;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ApiRequestTrace = {
  requestId: string;
  apiId: string;
  provider: string;
  method: string;
  path: string;
  requestRef: string;
  responseRef: string | null;
  statusCode: number | null;
  attempt: number;
  maxAttempts: number;
  rateLimited: boolean;
  circuitOpen: boolean;
  authStatus: "authenticated" | "rejected" | "skipped" | "refresh_structural";
  permissionGranted: boolean;
  durationMs: number;
  errorClass: string | null;
  timestamp: string;
  liveCallExecuted: boolean;
  fabricated: false;
  structuralSignalOnly: true;
  secretsExposed: false;
};

export type ProviderHealthSummary = {
  apiId: string;
  provider: string;
  healthStatus: HealthStatus;
  successCount: number;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  circuitState: CircuitState;
  rateLimitStatus: RateLimitStatus;
};

export type RequestStatistics = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  retriedRequests: number;
  liveCallsExecuted: number;
  structuralOnlyRequests: number;
  lastRequestAt: string | null;
};

export type FailureSummary = {
  totalFailures: number;
  byErrorClass: Record<string, number>;
  circuitOpenCount: number;
};

export type RetrySummary = {
  totalRetries: number;
  exhaustedRetries: number;
  averageAttempts: number;
};

export type AuthenticationStatusSummary = {
  authenticated: number;
  rejected: number;
  skipped: number;
  refreshStructural: number;
};

export type RateLimitSummary = {
  ok: number;
  approaching: number;
  exceeded: number;
};

export type ApiDiagnostics = {
  registeredProviderCount: number;
  activeConnectionCount: number;
  openCircuitCount: number;
  rateLimitedProviderCount: number;
  notes: string[];
};

export type ApiRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  registeredApis: ApiProviderRegistration[];
  activeConnections: ApiConnection[];
  providerHealth: ProviderHealthSummary[];
  requestStatistics: RequestStatistics;
  failureSummary: FailureSummary;
  retrySummary: RetrySummary;
  authenticationStatus: AuthenticationStatusSummary;
  rateLimitStatus: RateLimitSummary;
  apiDiagnostics: ApiDiagnostics;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1007: boolean;
  neverExposeSecrets: true;
  neverExposeCredentials: true;
  neverFabricateApiResponses: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1007OrLater: true;
  preserveCompleteTraceability: true;
  preserveRequestTraces: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  credentialReferenceOnly: true;
};

export type Q1007ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "api-runtime";
  missionId: "Q10-06";
  consumerMissionId: "Q10-07";
  exposedFields: string[];
  serviceTypeCatalog: string[];
  authMethodCatalog: string[];
  notes: string[];
  neverImplementQ1007OrLater: true;
  structuralSignalOnly: true;
};

export type ApirtInput = {
  apiId?: string;
  provider?: string;
  serviceType?: ServiceType;
  endpoint?: string;
  authMethod?: AuthMethod;
  credentialReference?: string;
  apiVersion?: string;
  connectionId?: string;
  method?: string;
  path?: string;
  requestRef?: string;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricateResponse?: boolean;
  exposeSecrets?: boolean;
  simulateTransientFailure?: boolean;
  refreshTokenReference?: string;
  allowedServices?: ServiceType[];
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1007OrLater?: boolean;
  targetMissionId?: string | null;
  unauthorized?: boolean;
};

export type ApirtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ApirtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: ApirtValidationReport;
  provider: ApiProviderRegistration | null;
  connection: ApiConnection | null;
  trace: ApiRequestTrace | null;
  traces: ApiRequestTrace[];
  apiRuntimeReport: ApiRuntimeReport | null;
  q1007Contract: Q1007ConsumableContract | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type ApirtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalProviders: number;
  totalConnections: number;
  totalTraces: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: ApirtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ApirtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalProviders: number;
  totalConnections: number;
  totalTraces: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type ApiRuntimeState = {
  engineVersion: "PILLOW-APIRT-001";
  missionId: "Q10-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ApiRuntimeConfiguration;
  latestReport: ApirtRunReport | null;
  engineRecord: ApirtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalProviders: number;
    totalTraces: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type ApiRuntimeCockpitSnapshot = {
  missionId: "Q10-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalProviders: number;
  totalConnections: number;
  totalTraces: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverExposeSecrets: true;
  neverFabricateApiResponses: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1007OrLater: true;
  structuralSignalOnly: true;
};
