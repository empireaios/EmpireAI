import type { ApprovalRuntimeConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  APVRT_CAPABILITIES,
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  POLICY_SCOPES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type ApprovalType = (typeof APPROVAL_TYPES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type PolicyScope = (typeof POLICY_SCOPES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ApvrtCapability = (typeof APVRT_CAPABILITIES)[number];

export type DecisionKind = "approve" | "reject" | "escalate" | "delegate" | "timeout";

export type ApprovalPolicy = {
  policyId: string;
  approvalType: ApprovalType;
  policyName: string;
  stages: string[];
  requiresPillow: boolean;
  requiresGrandKing: boolean;
  allowDelegation: boolean;
  allowEscalation: boolean;
  timeoutMs: number;
  highRisk: boolean;
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type DecisionRecord = {
  decisionId: string;
  approvalId: string;
  stage: string;
  approver: string;
  decision: DecisionKind;
  timestamp: string;
  notesRef: string | null;
  fabricated: false;
};

export type ApprovalRequest = {
  approvalId: string;
  requestId: string;
  missionId: string;
  factory: string;
  worker: string;
  approvalType: ApprovalType;
  approvalPolicy: string;
  requestedApprover: string;
  currentApprover: string;
  currentStatus: ApprovalStatus;
  decisionHistory: DecisionRecord[];
  timestampHistory: string[];
  escalationHistory: string[];
  auditReference: string;
  stageIndex: number;
  maxStages: number;
  resumeToken: string | null;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type ApprovalTimelineEntry = {
  approvalId: string;
  status: ApprovalStatus;
  stageIndex: number;
  currentApprover: string;
  timestamps: string[];
  structuralSignalOnly: true;
};

export type GovernanceSummary = {
  pillowEnforced: true;
  grandKingEnforced: true;
  neverFabricateApprovalDecisions: true;
  neverAutoApproveRestrictedActions: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1010OrLater: true;
  deterministicApprovalRouting: true;
  preserveApprovalHistory: true;
  preserveAuditHistory: true;
  preventUnauthorizedExecution: true;
  totalPolicies: number;
  totalRequests: number;
  totalDecisions: number;
  notes: string[];
};

export type ApprovalRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  activeApprovalRequests: ApprovalRequest[];
  pendingApprovals: ApprovalRequest[];
  approvedRequests: ApprovalRequest[];
  rejectedRequests: ApprovalRequest[];
  escalatedRequests: ApprovalRequest[];
  approvalTimelines: ApprovalTimelineEntry[];
  governanceSummary: GovernanceSummary;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1010: boolean;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverFabricateApprovalDecisions: true;
  neverAutoApproveRestrictedActions: true;
  neverImplementQ1010OrLater: true;
  neverReplaceBusinessLogic: true;
  neverReplaceWorkerImplementations: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveApprovalHistory: true;
  preserveAuditHistory: true;
  preventUnauthorizedExecution: true;
  deterministicApprovalRouting: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1010ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "approval-runtime";
  missionId: "Q10-09";
  consumerMissionId: "Q10-10";
  exposedFields: string[];
  approvalTypeCatalog: string[];
  approvalStatusCatalog: string[];
  policyScopeCatalog: string[];
  notes: string[];
  neverImplementQ1010OrLater: true;
  structuralSignalOnly: true;
};

export type ApvrtInput = {
  approvalId?: string;
  requestId?: string;
  policyId?: string;
  policyName?: string;
  approvalType?: ApprovalType;
  stages?: string[];
  requiresPillow?: boolean;
  requiresGrandKing?: boolean;
  allowDelegation?: boolean;
  allowEscalation?: boolean;
  timeoutMs?: number;
  missionId?: string;
  factory?: string;
  worker?: string;
  requestedApprover?: string;
  currentApprover?: string;
  approver?: string;
  decision?: DecisionKind;
  delegateTo?: string;
  escalateTo?: string;
  notesRef?: string | null;
  auditReference?: string;
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricateDecision?: boolean;
  autoApproveRestricted?: boolean;
  simulateTimeout?: boolean;
  exposeSecrets?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1010OrLater?: boolean;
  replaceBusinessLogic?: boolean;
  replaceWorkerImplementations?: boolean;
  targetMissionId?: string | null;
  policyScope?: PolicyScope;
};

export type ApvrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ApvrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: ApvrtValidationReport;
  policy: ApprovalPolicy | null;
  policies: ApprovalPolicy[];
  request: ApprovalRequest | null;
  requests: ApprovalRequest[];
  decisionRecord: DecisionRecord | null;
  decisions: DecisionRecord[];
  approvalRuntimeReport: ApprovalRuntimeReport | null;
  q1010Contract: Q1010ConsumableContract | null;
  requiredStages: string[];
  resumeToken: string | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type ApvrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPolicies: number;
  totalRequests: number;
  totalDecisions: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: ApvrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ApvrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalPolicies: number;
  totalRequests: number;
  totalDecisions: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type ApprovalRuntimeState = {
  engineVersion: "PILLOW-APVRT-001";
  missionId: "Q10-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ApprovalRuntimeConfiguration;
  latestReport: ApvrtRunReport | null;
  engineRecord: ApvrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPolicies: number;
    totalRequests: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type ApprovalRuntimeCockpitSnapshot = {
  missionId: "Q10-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPolicies: number;
  totalRequests: number;
  totalDecisions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateApprovalDecisions: true;
  neverAutoApproveRestrictedActions: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1010OrLater: true;
  structuralSignalOnly: true;
};
