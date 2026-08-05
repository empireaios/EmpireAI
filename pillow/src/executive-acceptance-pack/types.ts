import type { ExecutiveAcceptancePackConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  EAPRT_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  VALIDATION_STATUSES,
  AUDIT_SOURCES,
  CERTIFICATION_SOURCES,
  READINESS_EVIDENCE_SOURCES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ReadinessClassification = (typeof READINESS_CLASSIFICATIONS)[number];
export type ReadinessDecision = (typeof READINESS_DECISIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type EaprtCapability = (typeof EAPRT_CAPABILITIES)[number];
export type CertificationSource = (typeof CERTIFICATION_SOURCES)[number];
export type AuditSource = (typeof AUDIT_SOURCES)[number];
export type ReadinessEvidenceSource = (typeof READINESS_EVIDENCE_SOURCES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type EaprtHandle = object;

/** LOCKED ExecutiveAcceptance model fields. */
export type ExecutiveAcceptance = {
  acceptancePackId: string;
  repositoryVersion: string;
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  readinessSummary: ProductionReadinessSummary;
  riskSummary: RiskSummary;
  outstandingIssues: string[];
  deploymentRecommendation: DeploymentRecommendation;
  executiveChecklist: ExecutiveChecklistItem[];
  supportingEvidence: string[];
  auditReference: string;
  generationTimestamp: string;
};

export type CertificationReportRef = {
  source: CertificationSource;
  bound: boolean;
  reportId: string | null;
  decision: ReadinessDecision | null;
  classification: ReadinessClassification;
  evidence: string[];
};

export type CertificationSummary = {
  computedAt: string;
  totalSources: number;
  boundCount: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  deferredCount: number;
  reports: CertificationReportRef[];
  evidence: string[];
};

export type AuditReportRef = {
  source: AuditSource;
  bound: boolean;
  reportId: string | null;
  decision: ReadinessDecision | null;
  classification: ReadinessClassification;
  missionId: string | null;
  evidence: string[];
};

export type AuditSummary = {
  computedAt: string;
  totalSources: number;
  boundCount: number;
  certifiedCount: number;
  partiallyCertifiedCount: number;
  failedCount: number;
  missingCount: number;
  blockedCount: number;
  deferredCount: number;
  reports: AuditReportRef[];
  evidence: string[];
};

export type ProductionReadinessEvidenceRef = {
  source: ReadinessEvidenceSource;
  bound: boolean;
  evidencePresent: boolean;
  evidence: string[];
};

export type ProductionReadinessSummary = {
  computedAt: string;
  totalSources: number;
  boundCount: number;
  evidencePresentCount: number;
  overallClassification: ReadinessClassification;
  sources: ProductionReadinessEvidenceRef[];
  evidence: string[];
};

export type RiskSummary = {
  computedAt: string;
  totalRisks: number;
  criticalRisks: string[];
  moderateRisks: string[];
  lowRisks: string[];
  evidence: string[];
};

export type DeploymentRecommendation = {
  computedAt: string;
  recommendation: "deploy" | "withhold" | "escalate" | "defer";
  rationale: string[];
  grandKingDecisionRequired: true;
  evidence: string[];
};

export type ExecutiveChecklistItem = {
  itemId: string;
  category: "certification" | "audit" | "readiness" | "governance" | "prior_gate";
  label: string;
  status: ReadinessClassification;
  evidence: string[];
};

export type GovernanceSummary = {
  compliant: boolean;
  grandKingApprovalRequired: true;
  executiveAcceptancePackRequired: true;
  selfDocPresent: boolean;
  selfDocPath: string;
  boundaryLocksHonoured: boolean;
  evidence: string[];
};

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

/** Inbound — Q11-09 consumes Q1109ConsumableContract from Q11-08 (Financial Readiness Audit). */
export type Q1109ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type EaprtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED ExecutiveAcceptancePackReport minimum + CRT extras. */
export type ExecutiveAcceptancePackReport = {
  reportId: string;
  timestamp: string;
  packVersion: typeof import("./paths.js").EXECUTIVE_ACCEPTANCE_PACK_RUNTIME_VERSION;
  engineId: "PILLOW-EAPRT-001";
  missionId: "Q11-09";
  executiveSummary: string;
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  riskSummary: RiskSummary;
  outstandingIssues: string[];
  deploymentRecommendation: DeploymentRecommendation;
  executiveChecklist: ExecutiveChecklistItem[];
  supportingEvidence: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  acceptancePack: ExecutiveAcceptance;
  decision: ReadinessDecision;
  auditStatus: AuditStatus;
  validation: EaprtValidationReport;
  integrationSummary: IntegrationVerification;
  governanceSummary: GovernanceSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
  consumableByQ1110: boolean;
  neverImplementQ1110OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  ninthQ11Gate: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveImmutablePackHistory: true;
  preserveAuditHistory: true;
  deterministicPackBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateAcceptanceEvidence: true;
  neverHideFailedAudits: true;
  neverApproveProductionDeployment: true;
  neverOverrideFailedCertifications: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type EaprtInput = {
  reportId?: string | null;
  missionId?: string | null;
  grandKingInstructions?: string | null;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  deferPack?: boolean;
  fabricateAcceptanceEvidence?: boolean;
  hideFailedAudits?: boolean;
  approveProductionDeployment?: boolean;
  overrideFailedCertifications?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1110OrLater?: boolean;
  forceFail?: boolean;
};

export type EaprtRunReport = ExecutiveAcceptancePackReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type EaprtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EAPRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EaprtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type EaprtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: ExecutiveAcceptancePackReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverFabricateAcceptanceEvidence: true;
  neverHideFailedAudits: true;
  neverApproveProductionDeployment: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1110OrLater: true;
  ninthQ11Gate: true;
};

/** Q11-09's exposed contract — consumed by Q11-10 (Grand King Acceptance Gate). */
export type Q1110ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "executive-acceptance-pack";
  missionId: "Q11-09";
  consumerMissionId: "Q11-10";
  exposedFields: string[];
  readinessClassificationCatalog: string[];
  decisionCatalog: string[];
  notes: string[];
  neverImplementQ1110OrLater: true;
  structuralSignalOnly: true;
};

export type ExecutiveAcceptancePackState = {
  engineVersion: "PILLOW-EAPRT-001";
  missionId: "Q11-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveAcceptancePackConfiguration;
  latestReport: ExecutiveAcceptancePackReport | null;
  engineRecord: EaprtEngineRecord | null;
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

export type ExecutiveAcceptancePackCockpitSnapshot = {
  missionId: "Q11-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  lastDecision: ReadinessDecision | null;
  lastConfidenceScore: number | null;
  workerId: string;
  readinessClassificationOptions: ReadinessClassification[];
  neverFabricateAcceptanceEvidence: true;
  neverHideFailedAudits: true;
  neverApproveProductionDeployment: true;
  neverOverrideFailedCertifications: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1110OrLater: true;
  ninthQ11Gate: true;
};
