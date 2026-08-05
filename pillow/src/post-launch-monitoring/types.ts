import type { PostLaunchMonitoringConfiguration } from "./configuration.js";
import type {
  ALERT_STATUSES,
  BUSINESS_IMPACT_LEVELS,
  COMPONENT_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PLMRT_CAPABILITIES,
  PRODUCTION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type {
  DeploymentAuthorisationStatus,
  GrandKingDecision,
} from "../grand-king-acceptance-gate/types.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductionStatus = (typeof PRODUCTION_STATUSES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type BusinessImpact = (typeof BUSINESS_IMPACT_LEVELS)[number];
export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type PlmrtCapability = (typeof PLMRT_CAPABILITIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type PlmrtHandle = object;

/** LOCKED PostLaunchMonitoring model fields. */
export type PostLaunchMonitoringAssessment = {
  monitoringSessionId: string;
  componentId: string;
  componentType: ComponentType;
  productionStatus: ProductionStatus;
  healthScore: number;
  incidentCount: number;
  errorCount: number;
  warningCount: number;
  alertStatus: AlertStatus;
  businessImpact: BusinessImpact;
  supportingEvidence: string[];
  auditReference: string;
  timestamp: string;
};

export type GrandKingAcceptanceVerification = {
  verifiedAt: string;
  grandKingAcceptanceGranted: boolean;
  productionActiveMonitoring: boolean;
  grandKingDecision: GrandKingDecision | "unknown";
  deploymentAuthorisationStatus: DeploymentAuthorisationStatus | "unknown";
  q1111ContractConsumed: boolean;
  contractVersion: string | null;
  evidence: string[];
};

export type Q1111ContractConsumption = {
  attempted: boolean;
  consumed: boolean;
  contractVersion: string | null;
  fields: string[];
  evidence: string;
};

export type MonitoringSession = {
  sessionId: string;
  startedAt: string;
  productionActiveMonitoring: boolean;
  status: ProductionStatus;
  evidence: string[];
};

export type WorkerMonitoringSummary = {
  computedAt: string;
  totalWorkers: number;
  monitoredCount: number;
  healthyCount: number;
  degradedCount: number;
  blockedCount: number;
  assessments: PostLaunchMonitoringAssessment[];
  evidence: string[];
};

export type FactoryMonitoringSummary = {
  computedAt: string;
  totalFactories: number;
  monitoredCount: number;
  healthyCount: number;
  degradedCount: number;
  assessments: PostLaunchMonitoringAssessment[];
  evidence: string[];
};

export type WorkflowMonitoringSummary = {
  computedAt: string;
  structuralSignalPresent: boolean;
  workflowCount: number;
  assessments: PostLaunchMonitoringAssessment[];
  evidence: string[];
};

export type RuntimeMonitoringSummary = {
  computedAt: string;
  runtimeServicesMonitored: number;
  assessments: PostLaunchMonitoringAssessment[];
  evidence: string[];
};

export type ApiMonitoringSummary = {
  computedAt: string;
  apiIntegrationsMonitored: number;
  bound: boolean;
  assessments: PostLaunchMonitoringAssessment[];
  evidence: string[];
};

export type IncidentSummary = {
  computedAt: string;
  incidentCount: number;
  criticalCount: number;
  incidents: Array<Record<string, unknown>>;
  evidence: string[];
};

export type AlertSummary = {
  computedAt: string;
  alertCount: number;
  criticalCount: number;
  warningCount: number;
  alerts: Array<Record<string, unknown>>;
  evidence: string[];
};

export type ProductionHealthSummary = {
  computedAt: string;
  productionActiveMonitoring: boolean;
  overallHealthScore: number;
  overallProductionStatus: ProductionStatus;
  totalIncidents: number;
  totalErrors: number;
  totalWarnings: number;
  businessImpact: BusinessImpact;
  evidence: string[];
};

export type PlmrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

/** LOCKED PostLaunchMonitoringReport minimum + CRT extras. */
export type PostLaunchMonitoringReport = {
  reportId: string;
  timestamp: string;
  monitoringVersion: typeof import("./paths.js").POST_LAUNCH_MONITORING_RUNTIME_VERSION;
  engineId: "PILLOW-PLMRT-001";
  missionId: "Q11-11";
  productionHealthSummary: ProductionHealthSummary;
  workerSummary: WorkerMonitoringSummary;
  factorySummary: FactoryMonitoringSummary;
  runtimeSummary: RuntimeMonitoringSummary;
  apiSummary: ApiMonitoringSummary;
  workflowSummary: WorkflowMonitoringSummary;
  incidentSummary: IncidentSummary;
  alertSummary: AlertSummary;
  businessImpactSummary: { computedAt: string; level: BusinessImpact; rationale: string[]; evidence: string[] };
  supportingEvidence: string[];
  outstandingRisks: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  assessments: PostLaunchMonitoringAssessment[];
  grandKingAcceptanceGranted: boolean;
  productionActiveMonitoring: boolean;
  q1111ContractConsumed: Q1111ContractConsumption;
  consumableByQ1112: boolean;
  neverImplementQ1112OrLater: true;
  structuralSignalOnly: true;
  evidenceBasedOnly: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  validation: PlmrtValidationReport;
  traceabilityRefs: string[];
  runTimestamp: string;
  preserveCompleteTraceability: true;
  preserveMonitoringHistory: true;
  preserveAuditHistory: true;
  deterministicMonitoringBehaviour: true;
  maskSensitiveValues: true;
  neverFabricateProductionEvidence: true;
  neverSuppressCriticalIncidents: true;
  neverHideFailures: true;
  neverAutoModifyProduction: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type PlmrtInput = {
  reportId?: string | null;
  missionId?: string | null;
  monitoringSessionId?: string | null;
  pillowCommandConfirmed?: boolean;
  validated?: boolean;
  fabricateProductionEvidence?: boolean;
  suppressCriticalIncidents?: boolean;
  hideFailures?: boolean;
  autoModifyProduction?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1112OrLater?: boolean;
  forceHealthy?: boolean;
  forceFail?: boolean;
};

export type PlmrtRunReport = PostLaunchMonitoringReport;

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type PlmrtEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PLMRT-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PlmrtCapability[];
  totalReports: number;
  lastReportId: string | null;
  lastProductionActiveMonitoring: boolean | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type PlmrtCatalog = {
  reportVersion: string;
  workerId: string;
  reports: PostLaunchMonitoringReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  neverFabricateProductionEvidence: true;
  neverSuppressCriticalIncidents: true;
  neverImplementQ1112OrLater: true;
};

/** Q11-11 exposed contract — consumed by Q11-12 Q Series Certified (structural only). */
export type Q1112ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "post-launch-monitoring";
  missionId: "Q11-11";
  consumerMissionId: "Q11-12";
  exposedFields: string[];
  productionStatusCatalog: string[];
  alertStatusCatalog: string[];
  notes: string[];
  neverImplementQ1112OrLater: true;
  structuralSignalOnly: true;
};

export type PostLaunchMonitoringState = {
  engineVersion: "PILLOW-PLMRT-001";
  missionId: "Q11-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: PostLaunchMonitoringConfiguration;
  latestReport: PostLaunchMonitoringReport | null;
  engineRecord: PlmrtEngineRecord | null;
  grandKingAcceptanceGranted: boolean;
  productionActiveMonitoring: boolean;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    lastReportId: string | null;
    lastProductionActiveMonitoring: boolean | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type PostLaunchMonitoringCockpitSnapshot = {
  missionId: "Q11-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  latestReportId: string | null;
  grandKingAcceptanceGranted: boolean;
  productionActiveMonitoring: boolean;
  workerId: string;
  neverFabricateProductionEvidence: true;
  neverSuppressCriticalIncidents: true;
  neverHideFailures: true;
  neverAutoModifyProduction: true;
  neverImplementQ1112OrLater: true;
};

export type MonitoringHistoryEntry = {
  entryId: string;
  timestamp: string;
  sessionId: string | null;
  reportId: string | null;
  productionActiveMonitoring: boolean;
  evidence: string[];
};
