import type { BusinessFactoryAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  BFART_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type BfartCapability = (typeof BFART_CAPABILITIES)[number];

export type FactoryHandle = object;

/* ------------------------------------------------------------------------ */
/* Discovery — business factories, from the injected Shared Runtime Core    */
/* only. Never invented.                                                    */
/* ------------------------------------------------------------------------ */

/** Structural factory record as returned by sharedRuntimeCore factory discovery. */
export type DiscoveredFactoryRecord = {
  factoryKey: string;
  factoryName: string | null;
  series: string | null;
  missionId: string | null;
  healthStatus: string | null;
  evidencePresent: boolean | null;
};

export type FactoryDiscoveryResult = {
  discoveredAt: string;
  sharedRuntimeCoreInjected: boolean;
  discoveredCount: number;
  factories: DiscoveredFactoryRecord[];
  evidence: string[];
};

/** Structural worker record — reused shape from the Worker Registry, matched by `factory`. */
export type RegisteredWorkerRecord = {
  workerId: string;
  workerName: string | null;
  workerType: string | null;
  department: string | null;
  factory: string | null;
  role: string | null;
  reportingLine: string[];
  governingAuthority: string | null;
  skillProfile: string[];
  approvedTools: string[];
  authorityLevel: string | null;
  certificationStatus: string | null;
  operationalStatus: string | null;
};

export type WorkerDiscoveryResult = {
  discoveredAt: string;
  registryInjected: boolean;
  discoveredCount: number;
  workers: RegisteredWorkerRecord[];
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Per-dimension verification rows                                          */
/* ------------------------------------------------------------------------ */

export type RegistrationCheckRow = {
  factoryId: string;
  factoryName: string;
  registrationStatus: CheckStatus;
  evidence: string[];
};

export type WorkerCheckRow = {
  factoryId: string;
  factoryName: string;
  workerCount: number;
  workerStatus: CheckStatus;
  evidence: string[];
};

export type WorkflowCheckRow = {
  factoryId: string;
  factoryName: string;
  workflowStatus: CheckStatus;
  evidence: string[];
};

export type RuntimeCheckRow = {
  factoryId: string;
  factoryName: string;
  runtimeStatus: CheckStatus;
  evidence: string[];
};

export type GovernanceCheckRow = {
  factoryId: string;
  factoryName: string;
  governanceStatus: CheckStatus;
  evidence: string[];
};

export type OperationalCheckRow = {
  factoryId: string;
  factoryName: string;
  operationalStatus: CheckStatus;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Business Factory Assessment (single row of the factory matrix) — LOCKED  */
/* field set.                                                               */
/* ------------------------------------------------------------------------ */

export type BusinessFactoryAssessment = {
  factoryId: string;
  factoryName: string;
  registrationStatus: CheckStatus;
  workerStatus: CheckStatus;
  workflowStatus: CheckStatus;
  runtimeStatus: CheckStatus;
  integrationStatus: CheckStatus;
  governanceStatus: CheckStatus;
  operationalStatus: CheckStatus;
  readinessClassification: ReadinessClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

/* ------------------------------------------------------------------------ */
/* Summaries                                                                 */
/* ------------------------------------------------------------------------ */

export type GovernanceSummary = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  businessFactoryAuditRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  governedFactoryCount: number;
  totalFactories: number;
  evidence: string[];
};

export type WorkflowSummary = {
  workflowReadyFactoryCount: number;
  totalFactories: number;
  evidence: string[];
};

export type RuntimeSummary = {
  runtimeIntegratedFactoryCount: number;
  totalFactories: number;
  sharedRuntimeCoreBound: boolean;
  evidence: string[];
};

export type FactoryReadinessSummary = {
  computedAt: string;
  totalFactories: number;
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

/** Inbound — Q11-04 consumes the Q1104ConsumableContract exposed by Q11-03 (Pillow Command Audit). */
export type Q1104ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Validation                                                                */
/* ------------------------------------------------------------------------ */

export type BfartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/* ------------------------------------------------------------------------ */
/* Business Factory Audit Report                                            */
/* ------------------------------------------------------------------------ */

export type BusinessFactoryAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-BFART-v1";
  engineId: "PILLOW-BFART-001";
  missionId: "Q11-04";
  totalBusinessFactories: number;
  certifiedFactories: number;
  partiallyCertifiedFactories: number;
  failedFactories: number;
  missingFactories: number;
  blockedFactories: number;
  deferredFactories: number;
  workflowSummary: WorkflowSummary;
  runtimeSummary: RuntimeSummary;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  supportingEvidence: string[];
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  findings: string[];
  assessments: BusinessFactoryAssessment[];
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: BfartValidationReport;
  factoryReadinessSummary: FactoryReadinessSummary;
  factoryInventory: DiscoveredFactoryRecord[];
  q1104ContractConsumed: Q1104ContractConsumption;
  consumableByQ1105: boolean;
  neverImplementQ1105OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  fourthQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateAuditEvidence: true;
  neverCertifyIncompleteWorkflows: true;
  neverCertifyMissingIntegrations: true;
  neverAssumeImplementation: true;
  neverModifyFactoryImplementations: true;
  neverRepairFailedFactories: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type BfartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Explicit, evidence-based deferral — never inferred. */
  deferAudit?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyIncompleteWorkflows?: boolean;
  certifyMissingIntegrations?: boolean;
  assumeImplementation?: boolean;
  modifyFactoryImplementations?: boolean;
  repairFailedFactories?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1105OrLater?: boolean;
};

export type BfartRunReport = BusinessFactoryAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type BfartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BFART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BfartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type BfartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: BusinessFactoryAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateAuditEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1105OrLater: true;
  fourthQ11Gate: true;
};

/** Q11-04's own exposed contract — consumed by Q11-05 (Security Audit). */
export type Q1105ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "business-factory-audit";
  missionId: "Q11-04";
  consumerMissionId: "Q11-05";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1105OrLater: true;
  structuralSignalOnly: true;
};

export type BusinessFactoryAuditState = {
  engineVersion: "PILLOW-BFART-001";
  missionId: "Q11-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessFactoryAuditConfiguration;
  latestReport: BusinessFactoryAuditReport | null;
  engineRecord: BfartEngineRecord | null;
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

export type BusinessFactoryAuditCockpitSnapshot = {
  missionId: "Q11-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateAuditEvidence: true;
  neverCertifyIncompleteWorkflows: true;
  neverCertifyMissingIntegrations: true;
  neverAssumeImplementation: true;
  neverModifyFactoryImplementations: true;
  neverRepairFailedFactories: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1105OrLater: true;
  fourthQ11Gate: true;
};
