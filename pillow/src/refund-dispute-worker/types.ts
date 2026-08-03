import type { RefundDisputeWorkerConfiguration } from "./configuration.js";
import type {
  CASE_STATUSES,
  CASE_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  EXCEPTION_SEVERITIES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  POLICY_DECISIONS,
  RDW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CaseType = (typeof CASE_TYPES)[number] | (string & {});
export type CaseStatus = (typeof CASE_STATUSES)[number] | (string & {});
export type PolicyDecision = (typeof POLICY_DECISIONS)[number];
export type ExceptionSeverity = (typeof EXCEPTION_SEVERITIES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type RefundDisputeWorkerCapability = (typeof RDW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type CaseAction = {
  actionId: string;
  action: string;
  note: string;
  recordedAt: string;
};

export type CustomerCommunication = {
  communicationId: string;
  channel: string;
  message: string;
  generatedAt: string;
  status: string;
};

export type CaseEscalation = {
  escalationId: string;
  severity: ExceptionSeverity;
  reason: string;
  escalatedAt: string;
  target: "pillow";
};

export type SupplierCoordination = {
  coordinationId: string;
  supplierId: string;
  action: string;
  note: string;
  recordedAt: string;
};

export type HistoryEvent = {
  eventId: string;
  status: string;
  note: string;
  recordedAt: string;
};

export type PolicyEvaluation = {
  policyId: string;
  policyName: string;
  decision: PolicyDecision;
  rationale: string;
  authorityLevel: string;
  withinDelegatedAuthority: boolean;
  marketplaceRuleRefs: string[];
};

export type CaseResolution = {
  outcome: string;
  summary: string;
  recordedAt: string | null;
  closed: boolean;
};

/** Case request inputs for refund/dispute lifecycle operations (read-only financially). */
export type CaseRequestInput = {
  caseId?: string | null;
  orderId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  caseType?: CaseType | string | null;
  reason?: string | null;
  requestedAmount?: number | null;
  policyId?: string | null;
  currentStatus?: CaseStatus | string | null;
  requireSupplierCoordination?: boolean | null;
  orderAgeDays?: number | null;
  orderReportId?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  resolutionOutcome?: string | null;
};

/** Machine-readable Refund & Dispute Report (Q3-12). */
export type RefundDisputeReport = {
  caseId: string;
  timestamp: string;
  orderId: string;
  customerId: string;
  productId: string | null;
  productName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  caseType: CaseType;
  reason: string;
  policyEvaluation: PolicyEvaluation;
  currentStatus: CaseStatus;
  actionsTaken: CaseAction[];
  customerCommunications: CustomerCommunication[];
  resolution: CaseResolution;
  escalationStatus: "none" | "pending" | "escalated_to_pillow" | "resolved_after_escalation";
  escalations: CaseEscalation[];
  supplierCoordination: SupplierCoordination[];
  caseHistory: HistoryEvent[];
  recommendedAction: string;
  confidenceScore: number;
  orderReportId: string | null;
  evaluationId: string | null;
  discoveryId: string | null;
  businessMissionId: string | null;
  supportingEvidence: EvidenceItem[];
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverModifyFinancialLedgersDirectly: true;
  neverOverrideMarketplacePolicies: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ313OrLater: true;
  neverAuthorizeOutsideAuthorityMatrix: true;
  followApprovedPolicies: true;
  preserveCaseTraceability: true;
  preserveSupplierReferences: true;
  preserveCustomerCommunicationHistory: true;
  preserveAuditHistory: true;
  escalateBeyondDelegatedAuthority: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RefundDisputeWorkerInput = {
  caseId?: string | null;
  caseRequest?: CaseRequestInput | null;
  orderId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  caseType?: CaseType | string | null;
  reason?: string | null;
  requestedAmount?: number | null;
  policyId?: string | null;
  currentStatus?: CaseStatus | string | null;
  requireSupplierCoordination?: boolean | null;
  orderAgeDays?: number | null;
  orderReportId?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  resolutionOutcome?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  modifyFinancialLedgers?: boolean;
  overrideMarketplacePolicies?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ313OrLater?: boolean;
  authorizeOutsideAuthorityMatrix?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type RefundDisputeWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RefundDisputeWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-RDW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RefundDisputeWorkerCapability[];
  totalCases: number;
  lastCaseId: string | null;
  lastCaseType: CaseType | null;
  lastCaseStatus: CaseStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type RefundDisputeWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  cases: RefundDisputeReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverModifyFinancialLedgersDirectly: true;
  neverOverrideMarketplacePolicies: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverAuthorizeOutsideAuthorityMatrix: true;
};

export type RefundDisputeWorkerRunReport = {
  caseRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_refund_request"
    | "receive_return_request"
    | "receive_customer_dispute"
    | "classify_case_type"
    | "validate_against_policies"
    | "track_case_status"
    | "coordinate_with_supplier"
    | "generate_customer_communications"
    | "escalate_exceptional_cases"
    | "record_final_outcome"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: RefundDisputeWorkerEngineRecord;
  catalog: RefundDisputeWorkerCatalog | null;
  cases: RefundDisputeReport[];
  latestCase: RefundDisputeReport | null;
  integrations: IntegrationHandshake[];
  validation: RefundDisputeWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RefundDisputeWorkerState = {
  engineVersion: "PILLOW-RDW-001";
  missionId: "Q3-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: RefundDisputeWorkerConfiguration;
  latestReport: RefundDisputeWorkerRunReport | null;
  engineRecord: RefundDisputeWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCases: number;
    lastCaseId: string | null;
    lastCaseType: CaseType | null;
    lastCaseStatus: CaseStatus | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type RefundDisputeWorkerCockpitSnapshot = {
  missionId: "Q3-12";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalCases: number;
  latestCaseId: string | null;
  lastCaseType: CaseType | null;
  lastCaseStatus: CaseStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverModifyFinancialLedgersDirectly: true;
  neverOverrideMarketplacePolicies: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverAuthorizeOutsideAuthorityMatrix: true;
};
