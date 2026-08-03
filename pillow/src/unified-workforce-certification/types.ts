import type { UnifiedWorkforceCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_LEVELS,
  COMPONENT_PROBE_RESULTS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_DOMAINS,
  OPERATIONAL_STATES,
  UWC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationLevel = (typeof CERTIFICATION_LEVELS)[number];
export type IntegrationDomain = (typeof INTEGRATION_DOMAINS)[number];
export type ComponentProbeResult = (typeof COMPONENT_PROBE_RESULTS)[number];
export type UnifiedWorkforceCertificationCapability = (typeof UWC_CAPABILITIES)[number];

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

/** Machine-readable Unified Certification Report (Q0-30). */
export type UnifiedCertificationReport = {
  certificationId: string;
  timestamp: string;
  executiveFactoryVersion: string;
  executiveComponentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  integrationStatus: string;
  readinessAssessment: string;
  executiveHealth: string;
  remainingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel | string;
  metadataVersion: string;
  certificationTraceId: string;
  validationStatus: ValidationStatus;
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  q0ProductionReady: boolean;
  /** Explicit Q0-30 boundaries. */
  neverExecuteWorkerTasks: true;
  neverModifyExecutiveComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ1Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  executiveComponentsModified: false;
  failuresRepairedAutomatically: false;
  q1ImplementationBegun: false;
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

/** Input for Q0-30 — validate factory readiness only. */
export type UnifiedWorkforceCertificationInput = {
  certificationId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  componentId?: string | null;
  componentOverrides?: ComponentStatusOverride[];
  domainOverrides?: DomainStatusOverride[];
  failedComponents?: string[];
  warningComponents?: string[];
  failedDomains?: string[];
  warningDomains?: string[];
  forceResult?: CertificationLevel | string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  modifyExecutiveComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ1Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type UnifiedWorkforceCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type UnifiedWorkforceCertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-UWC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: UnifiedWorkforceCertificationCapability[];
  totalCertificationReports: number;
  certifiedCount: number;
  failedCount: number;
  lastFinalResult: CertificationLevel | string | null;
  q0ProductionReady: boolean;
  metadataVersion: string;
};

export type UnifiedWorkforceCertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_factory"
    | "verify_component"
    | "verify_integration"
    | "assess_readiness"
    | "produce_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: UnifiedWorkforceCertificationEngineRecord;
  reports: UnifiedCertificationReport[];
  finalCertificationResult: CertificationLevel | string | null;
  q0ProductionReady: boolean;
  componentsFailed: string[];
  validation: UnifiedWorkforceCertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type UnifiedWorkforceCertificationState = {
  engineVersion: "PILLOW-UWC-001";
  missionId: "Q0-30";
  status: EngineStatus;
  initializedAt: string;
  configuration: UnifiedWorkforceCertificationConfiguration;
  latestReport: UnifiedWorkforceCertificationRunReport | null;
  engineRecord: UnifiedWorkforceCertificationEngineRecord | null;
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
    q0ProductionReady: boolean;
    notes: string[];
  };
};

export type UnifiedWorkforceCertificationCockpitSnapshot = {
  missionId: "Q0-30";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationReports: number;
  latestCertificationId: string | null;
  q0ProductionReady: boolean;
  neverExecuteWorkerTasks: true;
  neverModifyExecutiveComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ1Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
