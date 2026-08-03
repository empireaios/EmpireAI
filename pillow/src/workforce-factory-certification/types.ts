import type { WorkforceFactoryCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_LEVELS,
  COMPONENT_PROBE_RESULTS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_DOMAINS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WFC_CAPABILITIES,
  WORKFORCE_GOVERNANCE_RULES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationLevel = (typeof CERTIFICATION_LEVELS)[number];
export type IntegrationDomain = (typeof INTEGRATION_DOMAINS)[number];
export type ComponentProbeResult = (typeof COMPONENT_PROBE_RESULTS)[number];
export type WorkforceGovernanceRule = (typeof WORKFORCE_GOVERNANCE_RULES)[number];
export type WorkforceFactoryCertificationCapability = (typeof WFC_CAPABILITIES)[number];

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
  rule: WorkforceGovernanceRule | string;
  result: ComponentProbeResult;
  detail: string;
};

/** Machine-readable Workforce Factory Certification Report (Q1-13). */
export type WorkforceFactoryCertificationReport = {
  certificationId: string;
  timestamp: string;
  workforceFactoryVersion: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  integrationStatus: string;
  workforceReadiness: string;
  governanceCompliance: string;
  remainingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel | string;
  metadataVersion: string;
  certificationTraceId: string;
  validationStatus: ValidationStatus;
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  q1ProductionReady: boolean;
  q2ReadinessConfirmed: boolean;
  /** Explicit Q1-13 boundaries. */
  neverExecuteWorkerTasks: true;
  neverModifyWorkforceComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ2Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workforceComponentsModified: false;
  failuresRepairedAutomatically: false;
  q2ImplementationBegun: false;
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

/** Input for Q1-13 — validate factory readiness only. */
export type WorkforceFactoryCertificationInput = {
  certificationId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
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
  executeWorkerTasks?: boolean;
  modifyWorkforceComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ2Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkforceFactoryCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceFactoryCertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WFC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceFactoryCertificationCapability[];
  totalCertificationReports: number;
  certifiedCount: number;
  failedCount: number;
  lastFinalResult: CertificationLevel | string | null;
  q1ProductionReady: boolean;
  q2ReadinessConfirmed: boolean;
  metadataVersion: string;
};

export type WorkforceFactoryCertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_factory"
    | "verify_component"
    | "verify_integration"
    | "verify_governance"
    | "assess_readiness"
    | "produce_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkforceFactoryCertificationEngineRecord;
  reports: WorkforceFactoryCertificationReport[];
  finalCertificationResult: CertificationLevel | string | null;
  q1ProductionReady: boolean;
  q2ReadinessConfirmed: boolean;
  componentsFailed: string[];
  validation: WorkforceFactoryCertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceFactoryCertificationState = {
  engineVersion: "PILLOW-WFC-001";
  missionId: "Q1-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceFactoryCertificationConfiguration;
  latestReport: WorkforceFactoryCertificationRunReport | null;
  engineRecord: WorkforceFactoryCertificationEngineRecord | null;
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
    q1ProductionReady: boolean;
    q2ReadinessConfirmed: boolean;
    notes: string[];
  };
};

export type WorkforceFactoryCertificationCockpitSnapshot = {
  missionId: "Q1-13";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationReports: number;
  latestCertificationId: string | null;
  q1ProductionReady: boolean;
  q2ReadinessConfirmed: boolean;
  neverExecuteWorkerTasks: true;
  neverModifyWorkforceComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ2Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
