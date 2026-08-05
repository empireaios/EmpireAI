import type { SecurityAuditConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  SECART_CAPABILITIES,
  SECURITY_COMPONENT_KEYS,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CheckStatus = (typeof CHECK_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type SecartCapability = (typeof SECART_CAPABILITIES)[number];
export type SecurityComponentKey = (typeof SECURITY_COMPONENT_KEYS)[number];

export type SecurityHandle = object;

/* ------------------------------------------------------------------------ */
/* Discovery — security components, from injected handles only. Never       */
/* invented.                                                                 */
/* ------------------------------------------------------------------------ */

/** Structural security component record — derived strictly from injected dependency presence. */
export type DiscoveredSecurityComponentRecord = {
  componentKey: SecurityComponentKey;
  componentName: string;
  componentType: string;
  bound: boolean;
  healthStatus: string | null;
  evidencePresent: boolean;
};

export type SecurityComponentDiscoveryResult = {
  discoveredAt: string;
  discoveredCount: number;
  totalCatalogued: number;
  components: DiscoveredSecurityComponentRecord[];
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Per-dimension verification rows                                          */
/* ------------------------------------------------------------------------ */

export type AuthenticationCheckRow = {
  componentId: string;
  componentName: string;
  authenticationStatus: CheckStatus;
  evidence: string[];
};

export type AuthorizationCheckRow = {
  componentId: string;
  componentName: string;
  authorizationStatus: CheckStatus;
  evidence: string[];
};

export type SecretManagementCheckRow = {
  componentId: string;
  componentName: string;
  secretStatus: CheckStatus;
  evidence: string[];
};

export type ApiSecurityCheckRow = {
  componentId: string;
  componentName: string;
  apiSecurityStatus: CheckStatus;
  evidence: string[];
};

export type DataProtectionCheckRow = {
  componentId: string;
  componentName: string;
  dataProtectionStatus: CheckStatus;
  evidence: string[];
};

export type RuntimeSecurityCheckRow = {
  componentId: string;
  componentName: string;
  runtimeSecurityStatus: CheckStatus;
  evidence: string[];
};

export type OperationalSecurityCheckRow = {
  componentId: string;
  componentName: string;
  operationalSecurityStatus: CheckStatus;
  evidence: string[];
};

/* ------------------------------------------------------------------------ */
/* Security Assessment (single row of the security matrix) — LOCKED field   */
/* set.                                                                      */
/* ------------------------------------------------------------------------ */

export type SecurityAssessment = {
  securityCheckId: string;
  componentId: string;
  componentType: string;
  authenticationStatus: CheckStatus;
  authorizationStatus: CheckStatus;
  secretStatus: CheckStatus;
  apiSecurityStatus: CheckStatus;
  dataProtectionStatus: CheckStatus;
  runtimeSecurityStatus: CheckStatus;
  operationalSecurityStatus: CheckStatus;
  readinessClassification: ReadinessClassification;
  supportingEvidence: string[];
  auditReference: string;
  auditTimestamp: string;
};

/* ------------------------------------------------------------------------ */
/* Summaries                                                                 */
/* ------------------------------------------------------------------------ */

export type SecurityDimensionSummary = {
  dimension:
    | "authentication"
    | "authorization"
    | "secretManagement"
    | "apiSecurity"
    | "dataProtection"
    | "runtimeSecurity"
    | "operationalSecurity";
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
  securityAuditRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  requiredComponentsBoundCount: number;
  totalRequiredComponents: number;
  evidence: string[];
};

export type SecurityReadinessSummary = {
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

/** Inbound — Q11-05 consumes the Q1105ConsumableContract exposed by Q11-04 (Business Factory Audit). */
export type Q1105ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

/* ------------------------------------------------------------------------ */
/* Validation                                                                */
/* ------------------------------------------------------------------------ */

export type SecartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/* ------------------------------------------------------------------------ */
/* Security Audit Report                                                    */
/* ------------------------------------------------------------------------ */

export type SecurityAuditReport = {
  reportId: string;
  timestamp: string;
  auditVersion: "Q11-SECART-v1";
  engineId: "PILLOW-SECART-001";
  missionId: "Q11-05";
  totalSecurityComponents: number;
  certifiedComponents: number;
  partiallyCertifiedComponents: number;
  failedComponents: number;
  missingComponents: number;
  blockedComponents: number;
  deferredComponents: number;
  authenticationSummary: SecurityDimensionSummary;
  authorizationSummary: SecurityDimensionSummary;
  secretManagementSummary: SecurityDimensionSummary;
  apiSecuritySummary: SecurityDimensionSummary;
  dataProtectionSummary: SecurityDimensionSummary;
  runtimeSecuritySummary: SecurityDimensionSummary;
  operationalSecuritySummary: SecurityDimensionSummary;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  criticalFindings: string[];
  supportingEvidence: string[];
  outstandingRisks: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  findings: string[];
  assessments: SecurityAssessment[];
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: SecartValidationReport;
  securityReadinessSummary: SecurityReadinessSummary;
  componentInventory: DiscoveredSecurityComponentRecord[];
  q1105ContractConsumed: Q1105ContractConsumption;
  consumableByQ1106: boolean;
  neverImplementQ1106OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  fifthQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutableAuditHistory: true;
  preserveAuditHistory: true;
  deterministicAuditBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateSecurityEvidence: true;
  neverCertifyInsecureImplementations: true;
  neverExposeSecretsDuringAuditing: true;
  neverAssumeImplementation: true;
  neverModifySecurityImplementations: true;
  neverRepairFailedSecurityComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SecartInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  /** Explicit, evidence-based deferral — never inferred. */
  deferAudit?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  fabricateSecurityEvidence?: boolean;
  forceFail?: boolean;
  certifyInsecureImplementations?: boolean;
  exposeSecretsDuringAuditing?: boolean;
  assumeImplementation?: boolean;
  modifySecurityImplementations?: boolean;
  repairFailedSecurityComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1106OrLater?: boolean;
};

export type SecartRunReport = SecurityAuditReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SecartEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SECART-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SecartCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SecartCatalog = {
  reportVersion: string;
  workerId: string;
  reports: SecurityAuditReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateSecurityEvidence: true;
  neverAssumeImplementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1106OrLater: true;
  fifthQ11Gate: true;
};

/** Q11-05's own exposed contract — consumed by Q11-06 (Performance Audit). */
export type Q1106ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "security-audit";
  missionId: "Q11-05";
  consumerMissionId: "Q11-06";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1106OrLater: true;
  structuralSignalOnly: true;
};

export type SecurityAuditState = {
  engineVersion: "PILLOW-SECART-001";
  missionId: "Q11-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SecurityAuditConfiguration;
  latestReport: SecurityAuditReport | null;
  engineRecord: SecartEngineRecord | null;
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

export type SecurityAuditCockpitSnapshot = {
  missionId: "Q11-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateSecurityEvidence: true;
  neverCertifyInsecureImplementations: true;
  neverExposeSecretsDuringAuditing: true;
  neverAssumeImplementation: true;
  neverModifySecurityImplementations: true;
  neverRepairFailedSecurityComponents: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1106OrLater: true;
  fifthQ11Gate: true;
};
