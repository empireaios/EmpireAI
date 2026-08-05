import type { RecoveryAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  RECART_CAPABILITIES,
  RECOVERY_COMPONENT_KEYS,
  ALL_RECOVERY_COMPONENT_KEYS,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ResilienceClassification = ReadinessClassification;
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type RecartCapability = (typeof RECART_CAPABILITIES)[number];
export type RecoveryComponentKey = (typeof RECOVERY_COMPONENT_KEYS)[number];
export type AllRecoveryComponentKey = (typeof ALL_RECOVERY_COMPONENT_KEYS)[number];

export type RecoveryHandle = object;

export type DiscoveredRecoveryComponentRecord = {
  componentKey: AllRecoveryComponentKey;
  componentName: string;
  componentType: string;
  bound: boolean;
  healthStatus: string | null;
  evidencePresent: boolean;
};

export type RecoveryComponentDiscoveryResult = {
  discoveredAt: string;
  discoveredCount: number;
  totalCatalogued: number;
  components: DiscoveredRecoveryComponentRecord[];
  evidence: string[];
};

/** LOCKED RecoveryAssessment field set. */
export type RecoveryAssessment = {
  recoveryCheckId: string;
  componentId: string;
  componentType: string;
  failureScenario: string;
  detectionStatus: CheckStatus;
  recoveryStatus: CheckStatus;
  restartStatus: CheckStatus;
  rollbackStatus: CheckStatus;
  checkpointStatus: CheckStatus;
  escalationStatus: CheckStatus;
  resilienceClassification: ResilienceClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

export type RecoveryDimensionSummary = {
  dimension:
    | "failureDetection"
    | "automaticRecovery"
    | "manualRecovery"
    | "rollback"
    | "workflowRestart"
    | "checkpointRestoration"
    | "escalation"
    | "enterpriseResilience";
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
  recoveryAuditRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  requiredComponentsBoundCount: number;
  totalRequiredComponents: number;
  evidence: string[];
};

export type RecoveryReadinessSummary = {
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

/** Inbound — Q11-07 consumes Q1107ConsumableContract from Q11-06 (Performance Audit). */
export type Q1107ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type RecartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED RecoveryAuditReport minimum + CRT extras. */
export type RecoveryAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-RECART-v1";
  engineId: "PILLOW-RECART-001";
  missionId: "Q11-07";
  totalRecoveryComponents: number;
  certifiedComponents: number;
  partiallyCertifiedComponents: number;
  failedComponents: number;
  missingComponents: number;
  blockedComponents: number;
  deferredComponents: number;
  recoverySummary: RecoveryReadinessSummary;
  failureDetectionSummary: RecoveryDimensionSummary;
  restartSummary: RecoveryDimensionSummary;
  rollbackSummary: RecoveryDimensionSummary;
  checkpointSummary: RecoveryDimensionSummary;
  escalationSummary: RecoveryDimensionSummary;
  resilienceSummary: RecoveryDimensionSummary;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  outstandingRisks: string[];
  supportingEvidence: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  findings: string[];
  assessments: RecoveryAssessment[];
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: RecartValidationReport;
  componentInventory: DiscoveredRecoveryComponentRecord[];
  q1107ContractConsumed: Q1107ContractConsumption;
  consumableByQ1108: boolean;
  neverImplementQ1108OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  seventhQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableRecoveryHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateRecoveryEvidence: true;
  neverCertifyUntestedRecovery: true;
  neverMutateProductionViaRecoveryCalls: true;
  neverAssumeImplementation: true;
  neverModifyRecoveryImplementations: true;
  neverRepairFailedRecoveryComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type RecartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  deferAudit?: boolean;
  fabricateRecoveryEvidence?: boolean;
  forceFail?: boolean;
  certifyUntestedRecovery?: boolean;
  mutateProductionViaRecoveryCalls?: boolean;
  assumeImplementation?: boolean;
  modifyRecoveryImplementations?: boolean;
  repairFailedRecoveryComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1108OrLater?: boolean;
};

export type RecartRunReport = RecoveryAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type RecartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-RECART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RecartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type RecartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: RecoveryAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateRecoveryEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1108OrLater: true;
  seventhQ11Gate: true;
};

/** Q11-07's exposed contract — consumed by Q11-08 (Financial Readiness Audit). */
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

export type RecoveryAuditState = {
  engineVersion: "PILLOW-RECART-001";
  missionId: "Q11-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: RecoveryAuditConfiguration;
  latestReport: RecoveryAuditReport | null;
  engineRecord: RecartEngineRecord | null;
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

export type RecoveryAuditCockpitSnapshot = {
  missionId: "Q11-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateRecoveryEvidence: true;
  neverCertifyUntestedRecovery: true;
  neverMutateProductionViaRecoveryCalls: true;
  neverAssumeImplementation: true;
  neverModifyRecoveryImplementations: true;
  neverRepairFailedRecoveryComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1108OrLater: true;
  seventhQ11Gate: true;
};

export type FailureDetectionCheckRow = {
  componentId: string;
  detectionStatus: CheckStatus;
  evidence: string[];
};

export type AutomaticRecoveryCheckRow = {
  componentId: string;
  recoveryStatus: CheckStatus;
  evidence: string[];
};

export type ManualRecoveryCheckRow = {
  componentId: string;
  recoveryStatus: CheckStatus;
  evidence: string[];
};

export type RollbackCheckRow = {
  componentId: string;
  rollbackStatus: CheckStatus;
  evidence: string[];
};

export type WorkflowRestartCheckRow = {
  componentId: string;
  restartStatus: CheckStatus;
  evidence: string[];
};

export type CheckpointRestorationCheckRow = {
  componentId: string;
  checkpointStatus: CheckStatus;
  evidence: string[];
};

export type RecoveryEscalationCheckRow = {
  componentId: string;
  escalationStatus: CheckStatus;
  evidence: string[];
};

export type EnterpriseResilienceCheckRow = {
  componentId: string;
  resilienceClassification: ResilienceClassification;
  evidence: string[];
};
