import type { CommerceCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_LEVELS,
  CMC_CAPABILITIES,
  COMMERCE_GOVERNANCE_RULES,
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
export type CertificationLevel = (typeof CERTIFICATION_LEVELS)[number] | (string & {});
export type IntegrationDomain = (typeof INTEGRATION_DOMAINS)[number];
export type ComponentProbeResult = (typeof COMPONENT_PROBE_RESULTS)[number];
export type CommerceGovernanceRule = (typeof COMMERCE_GOVERNANCE_RULES)[number];
export type CommerceCertificationCapability = (typeof CMC_CAPABILITIES)[number];

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
  rule: CommerceGovernanceRule | string;
  result: ComponentProbeResult;
  detail: string;
};

export type TraceabilityLink = {
  stage: string;
  missionId: string;
  artifactId: string | null;
  linkedFrom: string | null;
};

/** Machine-readable Commerce Certification Report (Q3-14). */
export type CommerceCertificationReport = {
  certificationId: string;
  timestamp: string;
  commerceFactoryVersion: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  integrationStatus: string;
  operationalReadiness: string;
  governanceCompliance: string;
  outstandingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel | string;
  metadataVersion: string;
  certificationTraceId: string;
  validationStatus: ValidationStatus;
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  traceabilityChain: TraceabilityLink[];
  executiveReportingStatus: string;
  q3ProductionReady: boolean;
  q4ReadinessConfirmed: boolean;
  /** Explicit Q3-14 boundaries. */
  neverOperateLiveCommerceBusiness: true;
  neverModifyCommerceFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ4Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  liveCommerceBusinessOperated: false;
  commerceFactoryComponentsModified: false;
  failuresRepairedAutomatically: false;
  q4ImplementationBegun: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveCertificationTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ComponentStatusOverride = {
  componentId: string;
  result?: ComponentProbeResult | string | null;
  detail?: string | null;
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

/** Input for Q3-14 — validate commerce factory readiness only. */
export type CommerceCertificationInput = {
  certificationId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  businessMissionId?: string | null;
  discoveryId?: string | null;
  evaluationId?: string | null;
  supplierDiscoveryId?: string | null;
  supplierEvaluationId?: string | null;
  negotiationId?: string | null;
  imageReportId?: string | null;
  listingId?: string | null;
  pricingId?: string | null;
  inventoryReportId?: string | null;
  orderReportId?: string | null;
  refundCaseId?: string | null;
  analyticsReportId?: string | null;
  executiveReportIds?: string[] | null;
  componentId?: string | null;
  componentOverrides?: ComponentStatusOverride[];
  domainOverrides?: DomainStatusOverride[];
  governanceOverrides?: GovernanceStatusOverride[];
  failedComponents?: string[];
  warningComponents?: string[];
  failedDomains?: string[];
  warningDomains?: string[];
  failedGovernanceRules?: string[];
  warningGovernanceRules?: string[];
  forceResult?: CertificationLevel | string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  operateLiveCommerceBusiness?: boolean;
  modifyCommerceFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ4Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type CommerceCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CommerceCertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CMC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CommerceCertificationCapability[];
  totalCertificationReports: number;
  certifiedCount: number;
  failedCount: number;
  lastFinalResult: CertificationLevel | string | null;
  q3ProductionReady: boolean;
  q4ReadinessConfirmed: boolean;
  metadataVersion: string;
};

export type CommerceCertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_factory"
    | "verify_component"
    | "verify_integration"
    | "verify_governance"
    | "verify_traceability"
    | "assess_readiness"
    | "produce_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CommerceCertificationEngineRecord;
  reports: CommerceCertificationReport[];
  finalCertificationResult: CertificationLevel | string | null;
  q3ProductionReady: boolean;
  q4ReadinessConfirmed: boolean;
  componentsFailed: string[];
  validation: CommerceCertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CommerceCertificationState = {
  engineVersion: "PILLOW-CMC-001";
  missionId: "Q3-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: CommerceCertificationConfiguration;
  latestReport: CommerceCertificationRunReport | null;
  engineRecord: CommerceCertificationEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCertificationReports: number;
    certifiedCount: number;
    failedCount: number;
    lastFinalResult: CertificationLevel | string | null;
    q3ProductionReady: boolean;
    q4ReadinessConfirmed: boolean;
    notes: string[];
  };
};

export type CommerceCertificationCockpitSnapshot = {
  missionId: "Q3-14";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationReports: number;
  latestCertificationId: string | null;
  q3ProductionReady: boolean;
  q4ReadinessConfirmed: boolean;
  neverOperateLiveCommerceBusiness: true;
  neverModifyCommerceFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ4Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
