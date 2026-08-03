import type { EmpireBuilderCertificationConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_LEVELS,
  COMPONENT_PROBE_RESULTS,
  EBC_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_DOMAINS,
  OPERATIONAL_STATES,
  PLANNING_GOVERNANCE_RULES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationLevel = (typeof CERTIFICATION_LEVELS)[number];
export type IntegrationDomain = (typeof INTEGRATION_DOMAINS)[number];
export type ComponentProbeResult = (typeof COMPONENT_PROBE_RESULTS)[number];
export type PlanningGovernanceRule = (typeof PLANNING_GOVERNANCE_RULES)[number];
export type EmpireBuilderCertificationCapability = (typeof EBC_CAPABILITIES)[number];

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
  rule: PlanningGovernanceRule | string;
  result: ComponentProbeResult;
  detail: string;
};

export type TraceabilityLink = {
  stage: string;
  missionId: string;
  artifactId: string | null;
  linkedFrom: string | null;
};

/** Machine-readable Empire Builder Certification Report (Q2-10). */
export type EmpireBuilderCertificationReport = {
  certificationId: string;
  timestamp: string;
  empireBuilderFactoryVersion: string;
  originalGrandKingCommand: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  integrationStatus: string;
  planningCompleteness: string;
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
  q2ProductionReady: boolean;
  q3ReadinessConfirmed: boolean;
  /** Explicit Q2-10 boundaries. */
  neverExecuteBusinessImplementation: true;
  neverModifyFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ3Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  businessImplementationExecuted: false;
  factoryComponentsModified: false;
  failuresRepairedAutomatically: false;
  q3ImplementationBegun: false;
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

/** Input for Q2-10 — validate factory readiness only. */
export type EmpireBuilderCertificationInput = {
  certificationId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  originalGrandKingCommand?: string | null;
  businessBuildMissionId?: string | null;
  intentId?: string | null;
  businessModelId?: string | null;
  marketResearchReportId?: string | null;
  opportunityEvaluationId?: string | null;
  businessBlueprintId?: string | null;
  launchPlanId?: string | null;
  businessRiskReportId?: string | null;
  approvalPackId?: string | null;
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
  executeBusinessImplementation?: boolean;
  modifyFactoryComponents?: boolean;
  repairFailuresAutomatically?: boolean;
  beginQ3Implementation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type EmpireBuilderCertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderCertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EBC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EmpireBuilderCertificationCapability[];
  totalCertificationReports: number;
  certifiedCount: number;
  failedCount: number;
  lastFinalResult: CertificationLevel | string | null;
  q2ProductionReady: boolean;
  q3ReadinessConfirmed: boolean;
  metadataVersion: string;
};

export type EmpireBuilderCertificationRunReport = {
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
  engineRecord: EmpireBuilderCertificationEngineRecord;
  reports: EmpireBuilderCertificationReport[];
  finalCertificationResult: CertificationLevel | string | null;
  q2ProductionReady: boolean;
  q3ReadinessConfirmed: boolean;
  componentsFailed: string[];
  validation: EmpireBuilderCertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpireBuilderCertificationState = {
  engineVersion: "PILLOW-EBC-001";
  missionId: "Q2-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpireBuilderCertificationConfiguration;
  latestReport: EmpireBuilderCertificationRunReport | null;
  engineRecord: EmpireBuilderCertificationEngineRecord | null;
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
    q2ProductionReady: boolean;
    q3ReadinessConfirmed: boolean;
    notes: string[];
  };
};

export type EmpireBuilderCertificationCockpitSnapshot = {
  missionId: "Q2-10";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCertificationReports: number;
  latestCertificationId: string | null;
  q2ProductionReady: boolean;
  q3ReadinessConfirmed: boolean;
  neverExecuteBusinessImplementation: true;
  neverModifyFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ3Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
