import type { DigitalProductsCertificationConfiguration } from "./configuration.js";

import type {

  CERTIFICATION_STATUSES,

  DPC_CAPABILITIES,

  DIGITAL_PRODUCTS_GOVERNANCE_RULES,

  COMPONENT_PROBE_RESULTS,

  ENGINE_STATUSES,

  HEALTH_STATUSES,

  INTEGRATION_DOMAINS,

  OPERATIONAL_STATES,

  VALIDATION_STATUSES,

} from "./paths.js";



export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number] | (string & {});

export type IntegrationDomain = (typeof INTEGRATION_DOMAINS)[number];

export type ComponentProbeResult = (typeof COMPONENT_PROBE_RESULTS)[number];

export type DigitalProductsGovernanceRule = (typeof DIGITAL_PRODUCTS_GOVERNANCE_RULES)[number];

export type DigitalProductsCertificationCapability = (typeof DPC_CAPABILITIES)[number];



export type ComponentVerification = {

  componentId: string;

  label: string;

  missionId: string;

  result: ComponentProbeResult;

  detail: string;

};



export type IntegrationVerification = {

  domain: IntegrationDomain | string;

  result: ComponentProbeResult;

  detail: string;

};



export type GovernanceVerification = {

  rule: DigitalProductsGovernanceRule | string;

  result: ComponentProbeResult;

  detail: string;

};



export type TraceabilityLink = {

  stage: string;

  missionId: string;

  artifactId: string | null;

  linkedFrom: string | null;

};



export type MissionVerificationEntry = {

  missionId: string;

  componentId: string;

  label: string;

  status: CertificationStatus;

  detail: string;

  rootCause?: string;

  evidence?: string;

  impact?: string;

  recommendedRemediation?: string;

};



export type WorkerVerificationEntry = {

  workerId: string;

  workerName: string;

  componentId: string;

  missionId: string;

  registered: boolean;

  invocable: boolean;

  dependenciesVerified: boolean;

  status: CertificationStatus;

  detail: string;

  rootCause?: string;

  evidence?: string;

  impact?: string;

  recommendedRemediation?: string;

};



export type WorkflowStageResult = {

  stage: string;

  missionId: string;

  artifactId: string | null;

  status: ComponentProbeResult;

  detail: string;

};



export type OutstandingIssue = {

  issueId: string;

  category: string;

  status: CertificationStatus;

  detail: string;

  rootCause?: string;

  evidence?: string;

  impact?: string;

  recommendedRemediation?: string;

};



/** Machine-readable Digital Products Certification Report (Q5-12). */

export type DigitalProductsCertificationReport = {

  certificationId: string;

  timestamp: string;

  reportVersion: string;

  factoryVersion: string;

  factoryStatus: string;

  digitalProductsTested: string[];

  missionVerificationMatrix: MissionVerificationEntry[];

  workerVerificationMatrix: WorkerVerificationEntry[];

  integrationResults: IntegrationVerification[];

  endToEndWorkflowResults: WorkflowStageResult[];

  failureRecoveryResults: {

    status: string;

    detail: string;

    recoveryProbesPassed: number;

    recoveryProbesFailed: number;

  };

  governanceResults: GovernanceVerification[];

  outstandingIssues: OutstandingIssue[];

  certificationStatus: CertificationStatus;

  executiveSummary: string;

  metadataVersion: string;

  certificationTraceId: string;

  validationStatus: ValidationStatus;

  componentVerifications: ComponentVerification[];

  integrationVerifications: IntegrationVerification[];

  governanceVerifications: GovernanceVerification[];

  traceabilityChain: TraceabilityLink[];

  recommendations: string[];

  q5ProductionReady: boolean;

  q6ReadinessConfirmed: boolean;

  executiveReportingStatus: string;

  failureRecoveryStatus: string;

  submittedToExecutiveReporting: boolean;

  executiveReportId: string | null;

  /** Explicit Q5-12 boundaries. */

  neverAutomaticallyFixFailures: true;

  neverAutomaticallyCertifyIncompleteWork: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverBeginQ6Implementation: true;

  neverAssumeImplementation: true;

  failuresFixedAutomatically: false;

  incompleteWorkAutoCertified: false;

  q6ImplementationBegun: false;

  implementationAssumed: false;

  pillowOverridden: boolean;

  grandKingOverridden: boolean;

  preserveCompleteTraceability: true;

  preserveAuditHistory: true;

  reportEveryDeviationHonestly: true;

  structuralSignalOnly: true;

  maskSensitiveValues: true;

};



export type ComponentStatusOverride = {

  componentId: string;

  result?: ComponentProbeResult | string | null;

  status?: CertificationStatus | string | null;

  detail?: string | null;

  missing?: boolean;

};



export type DomainStatusOverride = {

  domain: string;

  result?: ComponentProbeResult | string | null;

  detail?: string | null;

};



export type GovernanceStatusOverride = {

  rule: string;

  result?: ComponentProbeResult | string | null;

  detail?: string | null;

};



/** Input for Q5-12 — validate digital products factory readiness only. */

export type DigitalProductsCertificationInput = {

  certificationId?: string | null;

  missionId?: string | null;

  digitalProductIds?: string[] | null;

  digitalProductId?: string | null;

  businessId?: string | null;

  factoryMissionId?: string | null;

  researchReportId?: string | null;

  productArtifactId?: string | null;

  ebookId?: string | null;

  promptProductId?: string | null;

  courseId?: string | null;

  templateId?: string | null;

  designReportId?: string | null;

  salesPageId?: string | null;

  checkoutId?: string | null;

  purchaseSimulationId?: string | null;

  deliveryId?: string | null;

  analyticsReportId?: string | null;

  executiveReportIds?: string[] | null;

  componentId?: string | null;

  componentOverrides?: ComponentStatusOverride[];

  domainOverrides?: DomainStatusOverride[];

  governanceOverrides?: GovernanceStatusOverride[];

  failedComponents?: string[];

  warningComponents?: string[];

  missingComponents?: string[];

  failedDomains?: string[];

  warningDomains?: string[];

  failedGovernanceRules?: string[];

  warningGovernanceRules?: string[];

  forceStatus?: CertificationStatus | string | null;

  validated?: boolean;

  scanRepositoryEvidence?: boolean;

  /** Forbidden boundary attempts — always rejected. */

  automaticallyFixFailures?: boolean;

  automaticallyCertifyIncompleteWork?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  beginQ6Implementation?: boolean;

  assumeImplementation?: boolean;

  implementQ601OrLater?: boolean;

};



export type DigitalProductsCertificationValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



export type DigitalProductsCertificationEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: "PILLOW-DPC-001";

  currentOperationalState: OperationalState;

  healthStatus: HealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: DigitalProductsCertificationCapability[];

  totalCertificationReports: number;

  certifiedCount: number;

  failedCount: number;

  lastCertificationStatus: CertificationStatus | string | null;

  q5ProductionReady: boolean;

  q6ReadinessConfirmed: boolean;

  metadataVersion: string;

};



export type DigitalProductsCertificationRunReport = {

  certificationRunReportId: string;

  runTimestamp: string;

  action:

    | "connect"

    | "certify_factory"

    | "verify_worker_registration"

    | "verify_worker_invocation"

    | "verify_worker_dependencies"

    | "verify_end_to_end_workflow"

    | "verify_report_generation"

    | "verify_executive_reporting"

    | "verify_governance"

    | "verify_failure_recovery"

    | "verify_audit_trail"

    | "assess_readiness"

    | "produce_report"

    | "submit_report"

    | "list"

    | "validate"

    | "diagnostics";

  engineRecord: DigitalProductsCertificationEngineRecord;

  reports: DigitalProductsCertificationReport[];

  certificationStatus: CertificationStatus | string | null;

  q5ProductionReady: boolean;

  q6ReadinessConfirmed: boolean;

  componentsFailed: string[];

  validation: DigitalProductsCertificationValidationReport;

  durationMs: number;

  metadataVersion: string;

  submitResult?: {

    submitted: boolean;

    executiveReportId: string | null;

    details: string;

  } | null;

};



export type DigitalProductsCertificationState = {

  engineVersion: "PILLOW-DPC-001";

  missionId: "Q5-12";

  status: EngineStatus;

  initializedAt: string;

  configuration: DigitalProductsCertificationConfiguration;

  latestReport: DigitalProductsCertificationRunReport | null;

  engineRecord: DigitalProductsCertificationEngineRecord | null;

  health: {

    status: HealthStatus;

    healthScore: number;

    engineEnabled: boolean;

    lastOperationAt: string | null;

    lastValidationDecision: "pass" | "partial" | "fail" | null;

    totalCertificationReports: number;

    certifiedCount: number;

    failedCount: number;

    lastCertificationStatus: CertificationStatus | string | null;

    q5ProductionReady: boolean;

    q6ReadinessConfirmed: boolean;

    notes: string[];

  };

};



export type DigitalProductsCertificationCockpitSnapshot = {

  missionId: "Q5-12";

  status: EngineStatus;

  healthStatus: HealthStatus;

  totalCertificationReports: number;

  latestCertificationId: string | null;

  q5ProductionReady: boolean;

  q6ReadinessConfirmed: boolean;

  neverAutomaticallyFixFailures: true;

  neverAutomaticallyCertifyIncompleteWork: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverBeginQ6Implementation: true;

  neverAssumeImplementation: true;

};



export type AuditEvidenceResult = {

  missionId: string;

  path: string;

  found: boolean;

  finalPass: boolean;

  evidence: string;

};


