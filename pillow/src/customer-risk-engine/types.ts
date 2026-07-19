/** PILLOW-CRE-001 — Customer Risk Engine types (R4-14). */

import type {
  ALERT_STATUSES,
  CRE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RECOMMENDED_ACTIONS,
  RISK_CATEGORIES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CustomerRiskEngineConfiguration } from "./configuration.js";

export type CustomerRiskEngineVersion = "PILLOW-CRE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type CreCapability = (typeof CRE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CustomerRiskEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CreCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  ticketManagementEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  reviewManagementEngineConnected: boolean;
  returnsIntelligenceEngineConnected: boolean;
  metadataVersion: string;
};

export type CustomerRiskRecord = {
  customerRiskId: string;
  timestamp: string;
  customerId: string;
  riskCategory: RiskCategory;
  riskIndicators: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  alertStatus: AlertStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type CustomerRiskAlert = {
  alertId: string;
  timestamp: string;
  customerId: string;
  customerRiskId: string;
  alertType: RiskCategory;
  severity: RiskLevel;
  message: string;
  metadataVersion: string;
};

export type CustomerRiskFailure = {
  failureId: string;
  timestamp: string;
  customerRiskId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type CustomerRiskValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CustomerRiskRunReport = {
  customerRiskRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "evaluate_risk"
    | "detect_fraud"
    | "detect_abuse"
    | "detect_purchasing"
    | "detect_returns"
    | "detect_communication"
    | "calculate_score"
    | "generate_alerts"
    | "recommend_mitigation"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: CustomerRiskEngineRecord;
  customerRiskRecords: CustomerRiskRecord[];
  alerts: CustomerRiskAlert[];
  failures: CustomerRiskFailure[];
  validation: CustomerRiskValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CustomerRiskHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CustomerRiskValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCustomerRiskRecords: number;
  activeAlerts: number;
  highRiskCustomers: number;
  failedRecords: number;
  notes: string[];
};

export type CustomerRiskPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  riskEvaluations: number;
  fraudDetected: number;
  abuseDetected: number;
  purchasingFlags: number;
  returnFlags: number;
  communicationFlags: number;
  scoresCalculated: number;
  alertsGenerated: number;
  mitigationsRecommended: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CustomerRiskCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: CustomerRiskValidationReport["decision"] | null;
  totalCustomerRiskRecords: number;
  activeAlerts: number;
  highRiskCustomers: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type CreLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCustomerRiskEngineInput = { forceReconnect?: boolean };

export type EvaluateCustomerRiskInput = {
  customerId: string;
  riskCategory?: RiskCategory;
};

export type DetectFraudIndicatorsInput = { customerId: string };

export type DetectAccountAbuseInput = { customerId: string };

export type DetectSuspiciousPurchasingInput = { customerId: string };

export type DetectSuspiciousReturnBehaviourInput = { customerId: string };

export type DetectSuspiciousCommunicationInput = { customerId: string };

export type CalculateCustomerRiskScoreInput = { customerId: string };

export type GenerateCustomerRiskAlertsInput = { customerId?: string };

export type RecommendMitigationActionsInput = { customerRiskId: string };

export type DetectCustomerRiskFailuresInput = { customerRiskId?: string };

export type CustomerRiskEngineState = {
  engineVersion: CustomerRiskEngineVersion;
  missionId: "R4-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerRiskEngineConfiguration;
  latestReport: CustomerRiskRunReport | null;
  engineRecord: CustomerRiskEngineRecord | null;
  health: CustomerRiskHealthReport;
  performance: CustomerRiskPerformanceStats;
};
