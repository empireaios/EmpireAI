import type { MediaCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_LEVELS,
  MDC_CAPABILITIES,
  MEDIA_GOVERNANCE_RULES,
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
export type MediaGovernanceRule = (typeof MEDIA_GOVERNANCE_RULES)[number];
export type MediaCertificationCapability = (typeof MDC_CAPABILITIES)[number];

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
  rule: MediaGovernanceRule | string;
  result: ComponentProbeResult;
  detail: string;
};

export type TraceabilityLink = {
  stage: string;
  missionId: string;
  artifactId: string | null;
  linkedFrom: string | null;
};

/** Machine-readable Media Certification Report (Q4-19). */
export type MediaCertificationReport = {
  certificationId: string;
  timestamp: string;
  mediaFactoryVersion: string;
  mediaBusinessesTested: string[];
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  integrationStatus: string;
  autonomousOperationStatus: string;
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
  q4ProductionReady: boolean;
  q5ReadinessConfirmed: boolean;
  /** Explicit Q4-19 boundaries. */
  neverPublishMedia: true;
  neverModifyMediaFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ5Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  mediaPublished: false;
  mediaFactoryComponentsModified: false;
  failuresRepairedAutomatically: false;
  q5ImplementationBegun: false;
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

/** Input for Q4-19 — validate media factory readiness only. */
export type MediaCertificationInput = {
  certificationId?: string | null;
  missionId?: string | null;
  mediaBusinessIds?: string[] | null;
  mediaBusinessId?: string | null;
  channelId?: string | null;
  scriptId?: string | null;
  hookReportId?: string | null;
  thumbnailReportId?: string | null;
  visualResearchId?: string | null;
  imageCreativeId?: string | null;
  voiceReportId?: string | null;
  assemblyId?: string | null;
  subtitleReportId?: string | null;
  musicSoundReportId?: string | null;
  publishingReportId?: string | null;
  analyticsReportId?: string | null;
  learningReportId?: string | null;
  channelRecommendationId?: string | null;
  executiveReviewId?: string | null;
  trendReportId?: string | null;
  topicPlanId?: string | null;
  editorialStrategyId?: string | null;
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
  publishMedia?: boolean;
  modifyMediaFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ5Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type MediaCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MediaCertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MDC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MediaCertificationCapability[];
  totalCertificationReports: number;
  certifiedCount: number;
  failedCount: number;
  lastFinalResult: CertificationLevel | string | null;
  q4ProductionReady: boolean;
  q5ReadinessConfirmed: boolean;
  metadataVersion: string;
};

export type MediaCertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_factory"
    | "verify_component"
    | "verify_integration"
    | "verify_governance"
    | "verify_traceability"
    | "verify_autonomous_operation"
    | "assess_readiness"
    | "produce_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MediaCertificationEngineRecord;
  reports: MediaCertificationReport[];
  finalCertificationResult: CertificationLevel | string | null;
  q4ProductionReady: boolean;
  q5ReadinessConfirmed: boolean;
  componentsFailed: string[];
  validation: MediaCertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MediaCertificationState = {
  engineVersion: "PILLOW-MDC-001";
  missionId: "Q4-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: MediaCertificationConfiguration;
  latestReport: MediaCertificationRunReport | null;
  engineRecord: MediaCertificationEngineRecord | null;
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
    q4ProductionReady: boolean;
    q5ReadinessConfirmed: boolean;
    notes: string[];
  };
};

export type MediaCertificationCockpitSnapshot = {
  missionId: "Q4-19";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationReports: number;
  latestCertificationId: string | null;
  q4ProductionReady: boolean;
  q5ReadinessConfirmed: boolean;
  neverPublishMedia: true;
  neverModifyMediaFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ5Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
