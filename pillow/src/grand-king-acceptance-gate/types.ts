import type { GrandKingAcceptanceGateConfiguration } from "./configuration.js";

import type {

  AUDIT_STATUSES,

  CERTIFICATION_STATUSES,

  DEPLOYMENT_AUTHORISATION_STATUSES,

  ENGINE_HEALTH_STATUSES,

  ENGINE_STATUSES,

  GKAGT_CAPABILITIES,

  GRAND_KING_DECISIONS,

  INTEGRATION_TARGETS,

  OPERATIONAL_STATES,

  RE_REVIEW_STATUSES,

  VALIDATION_STATUSES,

} from "./paths.js";

import type {

  AuditSummary,

  CertificationSummary,

  DeploymentRecommendation,

  ExecutiveAcceptance,

  ExecutiveAcceptancePackReport,

  ProductionReadinessSummary,

  RiskSummary,

} from "../executive-acceptance-pack/types.js";



export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];

export type GrandKingDecision = (typeof GRAND_KING_DECISIONS)[number];

export type DeploymentAuthorisationStatus = (typeof DEPLOYMENT_AUTHORISATION_STATUSES)[number];

export type ReReviewStatus = (typeof RE_REVIEW_STATUSES)[number];

export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export type GkagtCapability = (typeof GKAGT_CAPABILITIES)[number];

export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];



export type GkagtHandle = object;



/** LOCKED GrandKingAcceptance model fields. */

export type GrandKingAcceptance = {

  acceptanceId: string;

  repositoryVersion: string;

  certificationStatus: CertificationStatus;

  executiveAcceptancePackReference: string;

  productionReadinessStatus: CertificationStatus;

  grandKingDecision: GrandKingDecision;

  decisionTimestamp: string | null;

  decisionComments: string | null;

  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;

  reReviewStatus: ReReviewStatus;

  supportingEvidence: string[];

  auditReference: string;

};



export type ExecutiveAcceptancePackCollection = {

  collectedAt: string;

  packReportId: string | null;

  packDecision: string | null;

  packReport: ExecutiveAcceptancePackReport | null;

  executiveAcceptance: ExecutiveAcceptance | null;

  evidence: string[];

};



export type PrerequisiteVerification = {

  verifiedAt: string;

  allPrerequisitesMet: boolean;

  pccrtCertified: boolean;

  packAuditCertified: boolean;

  packCertSummaryComplete: boolean;

  q1110ContractConsumed: boolean;

  packDecisionCertify: boolean;

  packNotWithholdOrFailed: boolean;

  outstandingIssues: string[];

  evidence: string[];

};



export type ProductionReadinessPresentation = {

  presentedAt: string;

  executiveAcceptanceSummary: string;

  certificationSummary: CertificationSummary | null;

  productionReadinessSummary: ProductionReadinessSummary | null;

  deploymentRecommendation: DeploymentRecommendation | null;

  riskSummary: RiskSummary | null;

  outstandingIssues: string[];

  presentationPayload: Record<string, unknown>;

  evidence: string[];

};



export type DeploymentAuthorisation = {

  authorisationId: string;

  issuedAt: string;

  acceptanceId: string;

  packReportId: string;

  grandKingDecision: "approve";

  deploymentAuthorisationStatus: "authorised";

  evidence: string[];

};



export type DecisionHistoryEntry = {

  entryId: string;

  timestamp: string;

  grandKingDecision: GrandKingDecision;

  decisionComments: string | null;

  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;

  reReviewStatus: ReReviewStatus;

  evidence: string[];

};



/** Inbound — Q11-10 consumes Q1110ConsumableContract from Q11-09 (Executive Acceptance Pack). */

export type Q1110ContractConsumption = {

  attempted: boolean;

  consumed: boolean;

  contractVersion: string | null;

  fields: string[];

  evidence: string;

};



export type GkagtValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



/** LOCKED GrandKingAcceptanceReport minimum + CRT extras. */

export type GrandKingAcceptanceReport = {

  reportId: string;

  timestamp: string;

  approvalVersion: typeof import("./paths.js").GRAND_KING_ACCEPTANCE_GATE_RUNTIME_VERSION;

  engineId: "PILLOW-GKAGT-001";

  missionId: "Q11-10";

  executiveAcceptanceSummary: string;

  certificationSummary: CertificationSummary | null;

  productionReadinessSummary: ProductionReadinessSummary | null;

  grandKingDecision: GrandKingDecision;

  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;

  outstandingIssues: string[];

  supportingEvidence: string[];

  auditStatus: AuditStatus;

  confidenceScore: number;

  metadataVersion: string;

  reportVersion: string;

  workerId: string;

  acceptance: GrandKingAcceptance;

  decisionHistoryRefs: string[];

  validation: GkagtValidationReport;

  q1110ContractConsumed: Q1110ContractConsumption;

  consumableByQ1201: boolean;

  neverImplementQ1201OrLater: true;

  structuralSignalOnly: true;

  evidenceBasedOnly: true;

  finalQ11Gate: true;

  submittedToExecutiveReporting: boolean;

  executiveReportId: string | null;

  deploymentAuthorisation: DeploymentAuthorisation | null;

  reReviewStatus: ReReviewStatus;

  traceabilityRefs: string[];

  runTimestamp: string;

  preserveCompleteTraceability: true;

  preserveImmutableApprovalHistory: true;

  preserveAuditHistory: true;

  deterministicGateBehaviour: true;

  maskSensitiveValues: true;

  neverFabricateApprovalEvidence: true;

  neverBypassGrandKingApproval: true;

  neverAuthoriseWithoutApproval: true;

  neverOverrideFailedCertifications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

};



export type GkagtInput = {

  reportId?: string | null;

  missionId?: string | null;

  grandKingInstructions?: string | null;

  grandKingApproved?: boolean;

  grandKingDecision?: GrandKingDecision;

  decisionComments?: string | null;

  pillowCommandConfirmed?: boolean;

  validated?: boolean;

  deferDecision?: boolean;

  fabricateApprovalEvidence?: boolean;

  bypassGrandKingApproval?: boolean;

  authoriseWithoutApproval?: boolean;

  overrideFailedCertifications?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ1201OrLater?: boolean;

  forceApprove?: boolean;

  forceFail?: boolean;

};



export type GkagtRunReport = GrandKingAcceptanceReport;



export type IntegrationHandshake = {

  target: IntegrationTarget;

  status: "ready" | "bound" | "unavailable";

  details: string;

  timestamp: string;

};



export type GkagtEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: "PILLOW-GKAGT-001";

  currentOperationalState: OperationalState;

  healthStatus: EngineHealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: GkagtCapability[];

  totalReports: number;

  lastReportId: string | null;

  lastGrandKingDecision: GrandKingDecision | null;

  lastDeploymentAuthorisationStatus: DeploymentAuthorisationStatus | null;

  lastConfidenceScore: number | null;

  workerId: string;

  integrationTargets: IntegrationTarget[];

  metadataVersion: string;

};



export type GkagtCatalog = {

  reportVersion: string;

  workerId: string;

  reports: GrandKingAcceptanceReport[];

  integrations: IntegrationHandshake[];

  metadataVersion: string;

  executiveAuthority: "grand_king";

  neverFabricateApprovalEvidence: true;

  neverBypassGrandKingApproval: true;

  neverAuthoriseWithoutApproval: true;

  neverImplementQ1201OrLater: true;

  finalQ11Gate: true;

};



/** Q11-10's exposed contract — consumed by Q11-11 Post-Launch Monitoring (structural only). */

export type Q1111ConsumableContract = {

  contractId: string;

  contractVersion: string;

  producedBy: "grand-king-acceptance-gate";

  missionId: "Q11-10";

  consumerMissionId: "Q11-11";

  exposedFields: string[];

  grandKingDecisionCatalog: string[];

  deploymentAuthorisationCatalog: string[];

  notes: string[];

  neverImplementQ1111OrLater: true;

  structuralSignalOnly: true;

};



/** Q11-10's exposed contract — consumed by Q12-01 (structural only; Q11-10 never implements Q12). */

export type Q1201ConsumableContract = {

  contractId: string;

  contractVersion: string;

  producedBy: "grand-king-acceptance-gate";

  missionId: "Q11-10";

  consumerMissionId: "Q12-01";

  exposedFields: string[];

  grandKingDecisionCatalog: string[];

  deploymentAuthorisationCatalog: string[];

  notes: string[];

  neverImplementQ1201OrLater: true;

  structuralSignalOnly: true;

};



export type GrandKingAcceptanceGateState = {

  engineVersion: "PILLOW-GKAGT-001";

  missionId: "Q11-10";

  status: EngineStatus;

  initializedAt: string;

  configuration: GrandKingAcceptanceGateConfiguration;

  latestReport: GrandKingAcceptanceReport | null;

  engineRecord: GkagtEngineRecord | null;

  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;

  grandKingDecision: GrandKingDecision;

  reReviewStatus: ReReviewStatus;

  health: {

    status: EngineHealthStatus;

    healthScore: number;

    engineEnabled: boolean;

    lastOperationAt: string | null;

    lastValidationDecision: "pass" | "partial" | "fail" | null;

    totalReports: number;

    lastReportId: string | null;

    lastGrandKingDecision: GrandKingDecision | null;

    lastDeploymentAuthorisationStatus: DeploymentAuthorisationStatus | null;

    lastConfidenceScore: number | null;

    notes: string[];

  };

};



export type GrandKingAcceptanceGateCockpitSnapshot = {

  missionId: "Q11-10";

  status: EngineStatus;

  healthStatus: EngineHealthStatus;

  totalReports: number;

  latestReportId: string | null;

  grandKingDecision: GrandKingDecision;

  deploymentAuthorisationStatus: DeploymentAuthorisationStatus;

  reReviewStatus: ReReviewStatus;

  workerId: string;

  grandKingDecisionOptions: GrandKingDecision[];

  neverFabricateApprovalEvidence: true;

  neverBypassGrandKingApproval: true;

  neverAuthoriseWithoutApproval: true;

  neverOverrideFailedCertifications: true;

  neverImplementQ1201OrLater: true;

  finalQ11Gate: true;

};



export type { AuditSummary, CertificationSummary, ProductionReadinessSummary };

