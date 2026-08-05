import type { MonitoringRuntimeConfiguration } from "./configuration.js";
import type {
  ALERT_SEVERITIES,
  AUDIT_STATUSES,
  COMPONENT_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INTEGRATION_TARGETS,
  MONRT_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MonrtCapability = (typeof MONRT_CAPABILITIES)[number];

export type MonitoredComponent = {
  monitoringId: string;
  componentId: string;
  componentType: ComponentType;
  currentStatus: HealthStatus;
  healthScore: number;
  availability: number;
  latencyMs: number;
  errorCount: number;
  warningCount: number;
  criticalAlertCount: number;
  lastSuccessfulHeartbeat: string | null;
  monitoringTimestamp: string;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type MonitoringAlert = {
  alertId: string;
  monitoringId: string;
  componentId: string;
  componentType: ComponentType;
  severity: AlertSeverity;
  messageRef: string;
  suppressed: false;
  acknowledged: boolean;
  timestamp: string;
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
};

export type HeartbeatRecord = {
  heartbeatId: string;
  monitoringId: string;
  componentId: string;
  componentType: ComponentType;
  timestamp: string;
  latencyMs: number;
  success: boolean;
  errorCountDelta: number;
  warningCountDelta: number;
  availabilitySample: number;
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type AnomalyRecord = {
  anomalyId: string;
  monitoringId: string;
  componentId: string;
  componentType: ComponentType;
  anomalyType: "error_threshold" | "latency_threshold" | "availability_threshold" | "critical_alert";
  observedValue: number;
  thresholdValue: number;
  timestamp: string;
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
};

export type HealthSnapshot = {
  category: ComponentType | "enterprise";
  components: MonitoredComponent[];
  averageHealthScore: number;
  averageAvailability: number;
  criticalAlertCount: number;
  status: HealthStatus;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type EnterpriseHealthSummary = {
  overallHealthScore: number;
  overallStatus: HealthStatus;
  categoryScores: Record<string, number>;
  totalComponents: number;
  healthyCount: number;
  degradedCount: number;
  warningCount: number;
  criticalCount: number;
  unavailableCount: number;
  standbyCount: number;
  unknownCount: number;
  criticalAlertCount: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type MonitoringRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  enterpriseHealthSummary: EnterpriseHealthSummary;
  workerHealth: HealthSnapshot;
  factoryHealth: HealthSnapshot;
  runtimeHealth: HealthSnapshot;
  apiHealth: HealthSnapshot;
  queueHealth: HealthSnapshot;
  missionHealth: HealthSnapshot;
  toolHealth: HealthSnapshot;
  activeAlerts: MonitoringAlert[];
  criticalEvents: MonitoringAlert[];
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1011: boolean;
  neverFabricateHealthInformation: true;
  neverSuppressCriticalAlerts: true;
  neverReplaceRecoverySystems: true;
  neverAutomaticallyRepairFailures: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1011OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExecuteBusinessLogic: true;
  preserveCompleteTraceability: true;
  preserveMonitoringHistory: true;
  preserveAuditHistory: true;
  deterministicHealthCalculations: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1011ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "monitoring-runtime";
  missionId: "Q10-10";
  consumerMissionId: "Q10-11";
  exposedFields: string[];
  componentTypeCatalog: string[];
  healthStatusCatalog: string[];
  alertSeverityCatalog: string[];
  notes: string[];
  neverImplementQ1011OrLater: true;
  structuralSignalOnly: true;
};

export type MonrtInput = {
  monitoringId?: string;
  componentId?: string;
  componentType?: ComponentType;
  latencyMs?: number;
  success?: boolean;
  errorCountDelta?: number;
  warningCountDelta?: number;
  availabilitySample?: number;
  auditReference?: string;
  acknowledged?: boolean;
  alertId?: string;
  suppressCritical?: boolean;
  fabricateHealth?: boolean;
  suppressCriticalAlerts?: boolean;
  autoRepair?: boolean;
  replaceRecovery?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  exposeSecrets?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1011OrLater?: boolean;
  executeBusinessLogic?: boolean;
  targetMissionId?: string | null;
  missionId?: string | null;
};

export type MonrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MonrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: MonrtValidationReport;
  component: MonitoredComponent | null;
  components: MonitoredComponent[];
  heartbeat: HeartbeatRecord | null;
  heartbeats: HeartbeatRecord[];
  alert: MonitoringAlert | null;
  alerts: MonitoringAlert[];
  anomalies: AnomalyRecord[];
  healthSnapshot: HealthSnapshot | null;
  healthSnapshots: HealthSnapshot[];
  monitoringRuntimeReport: MonitoringRuntimeReport | null;
  q1011Contract: Q1011ConsumableContract | null;
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type MonrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalComponents: number;
  totalHeartbeats: number;
  totalAlerts: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: MonrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MonrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalComponents: number;
  totalHeartbeats: number;
  totalAlerts: number;
  totalAnomalies: number;
  totalReports: number;
  criticalAlertCount: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type MonitoringRuntimeState = {
  engineVersion: "PILLOW-MONRT-001";
  missionId: "Q10-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: MonitoringRuntimeConfiguration;
  latestReport: MonrtRunReport | null;
  engineRecord: MonrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalComponents: number;
    totalAlerts: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type MonitoringRuntimeCockpitSnapshot = {
  missionId: "Q10-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalComponents: number;
  totalHeartbeats: number;
  totalAlerts: number;
  criticalAlertCount: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateHealthInformation: true;
  neverSuppressCriticalAlerts: true;
  neverAutomaticallyRepairFailures: true;
  neverReplaceRecoverySystems: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1011OrLater: true;
  structuralSignalOnly: true;
};
