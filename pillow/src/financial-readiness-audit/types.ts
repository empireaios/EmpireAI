import type { FinancialReadinessAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  FINART_CAPABILITIES,
  FINANCIAL_COMPONENT_KEYS,
  ALL_FINANCIAL_COMPONENT_KEYS,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type FinancialReadinessClassification = ReadinessClassification;
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type FinartCapability = (typeof FINART_CAPABILITIES)[number];
export type FinancialComponentKey = (typeof FINANCIAL_COMPONENT_KEYS)[number];
export type AllFinancialComponentKey = (typeof ALL_FINANCIAL_COMPONENT_KEYS)[number];

export type FinancialHandle = object;

export type DiscoveredFinancialComponentRecord = {
  componentKey: AllFinancialComponentKey;
  componentName: string;
  componentType: string;
  bound: boolean;
  healthStatus: string | null;
  evidencePresent: boolean;
};

export type FinancialComponentDiscoveryResult = {
  discoveredAt: string;
  discoveredCount: number;
  totalCatalogued: number;
  components: DiscoveredFinancialComponentRecord[];
  evidence: string[];
};

/** LOCKED FinancialAssessment field set. */
export type FinancialAssessment = {
  financialCheckId: string;
  componentId: string;
  componentType: string;
  financialScenario: string;
  paymentWorkflowStatus: CheckStatus;
  revenueRecordingStatus: CheckStatus;
  expenseTrackingStatus: CheckStatus;
  accountingRecordsStatus: CheckStatus;
  financialReportingStatus: CheckStatus;
  costControlStatus: CheckStatus;
  financialGovernanceStatus: CheckStatus;
  auditTraceabilityStatus: CheckStatus;
  readinessClassification: FinancialReadinessClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

export type FinancialDimensionSummary = {
  dimension:
    | "paymentWorkflows"
    | "revenueRecording"
    | "expenseTracking"
    | "accountingRecords"
    | "financialReporting"
    | "costControls"
    | "financialGovernance"
    | "auditTraceability";
  passedCount: number;
  partialCount: number;
  failedCount: number;
  missingCount: number;
  totalComponents: number;
  evidence: string[];
};

export type GovernanceSummary = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  financialReadinessAuditRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  requiredComponentsBoundCount: number;
  totalRequiredComponents: number;
  evidence: string[];
};

export type FinancialReadinessSummary = {
  computedAt: string;
  totalComponents: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  deferredCount: number;
  overallReadinessScore: number;
  allCertified: boolean;
  notes: string[];
  evidence: string[];
};

export type IntegrationTarget = (typeof import("./paths.js").INTEGRATION_TARGETS)[number];

export type IntegrationCheckRow = {
  target: IntegrationTarget;
  bound: boolean;
  evidence: string;
};

export type IntegrationVerification = {
  verifiedAt: string;
  rows: IntegrationCheckRow[];
  totalTargets: number;
  boundCount: number;
  allBound: boolean;
  evidence: string[];
};

/** Inbound — Q11-08 consumes Q1108ConsumableContract from Q11-07 (Recovery Audit). */
export type Q1108ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type FinartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED FinancialReadinessAuditReport minimum + CRT extras. */
export type FinancialReadinessAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-FINART-v1";
  engineId: "PILLOW-FINART-001";
  missionId: "Q11-08";
  totalFinancialComponents: number;
  certifiedComponents: number;
  partiallyCertifiedComponents: number;
  failedComponents: number;
  missingComponents: number;
  blockedComponents: number;
  deferredComponents: number;
  financialReadinessSummary: FinancialReadinessSummary;
  paymentWorkflowSummary: FinancialDimensionSummary;
  revenueRecordingSummary: FinancialDimensionSummary;
  expenseTrackingSummary: FinancialDimensionSummary;
  accountingRecordsSummary: FinancialDimensionSummary;
  financialReportingSummary: FinancialDimensionSummary;
  costControlSummary: FinancialDimensionSummary;
  financialGovernanceSummary: FinancialDimensionSummary;
  auditTraceabilitySummary: FinancialDimensionSummary;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  outstandingRisks: string[];
  supportingEvidence: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  findings: string[];
  assessments: FinancialAssessment[];
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: FinartValidationReport;
  componentInventory: DiscoveredFinancialComponentRecord[];
  q1108ContractConsumed: Q1108ContractConsumption;
  consumableByQ1109: boolean;
  neverImplementQ1109OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  eighthQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableFinancialHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateFinancialEvidence: true;
  neverCertifyUnverifiedFinancialCapability: true;
  neverExecuteFinancialTransactions: true;
  neverModifyAccountingRecords: true;
  neverAssumeImplementation: true;
  neverRepairFailedFinancialComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type FinartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  deferAudit?: boolean;
  fabricateFinancialEvidence?: boolean;
  forceFail?: boolean;
  certifyUnverifiedFinancialCapability?: boolean;
  executeFinancialTransactions?: boolean;
  modifyAccountingRecords?: boolean;
  assumeImplementation?: boolean;
  repairFailedFinancialComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1109OrLater?: boolean;
};

export type FinartRunReport = FinancialReadinessAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type FinartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-FINART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FinartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type FinartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: FinancialReadinessAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateFinancialEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1109OrLater: true;
  eighthQ11Gate: true;
};

/** Q11-08's exposed contract — consumed by Q11-09 (Executive Acceptance Pack). */
export type Q1109ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "financial-readiness-audit";
  missionId: "Q11-08";
  consumerMissionId: "Q11-09";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1109OrLater: true;
  structuralSignalOnly: true;
};

/** Re-export inbound contract shape from recovery-audit for consumers. */
export type Q1108ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "recovery-audit";
  missionId: "Q11-07";
  consumerMissionId: "Q11-08";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1108OrLater: true;
  structuralSignalOnly: true;
};

export type FinancialReadinessAuditState = {
  engineVersion: "PILLOW-FINART-001";
  missionId: "Q11-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialReadinessAuditConfiguration;
  latestReport: FinancialReadinessAuditReport | null;
  engineRecord: FinartEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastDecision: ReadinessDecision | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type FinancialReadinessAuditCockpitSnapshot = {
  missionId: "Q11-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateFinancialEvidence: true;
  neverCertifyUnverifiedFinancialCapability: true;
  neverExecuteFinancialTransactions: true;
  neverModifyAccountingRecords: true;
  neverAssumeImplementation: true;
  neverRepairFailedFinancialComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1109OrLater: true;
  eighthQ11Gate: true;
};

export type PaymentWorkflowCheckRow = {
  componentId: string;
  paymentWorkflowStatus: CheckStatus;
  evidence: string[];
};

export type RevenueRecordingCheckRow = {
  componentId: string;
  revenueRecordingStatus: CheckStatus;
  evidence: string[];
};

export type ExpenseTrackingCheckRow = {
  componentId: string;
  expenseTrackingStatus: CheckStatus;
  evidence: string[];
};

export type AccountingRecordsCheckRow = {
  componentId: string;
  accountingRecordsStatus: CheckStatus;
  evidence: string[];
};

export type FinancialReportingCheckRow = {
  componentId: string;
  financialReportingStatus: CheckStatus;
  evidence: string[];
};

export type CostControlCheckRow = {
  componentId: string;
  costControlStatus: CheckStatus;
  evidence: string[];
};

export type FinancialGovernanceCheckRow = {
  componentId: string;
  financialGovernanceStatus: CheckStatus;
  evidence: string[];
};

export type AuditTraceabilityCheckRow = {
  componentId: string;
  auditTraceabilityStatus: CheckStatus;
  evidence: string[];
};
