/** PILLOW-RIE-001 — Returns Intelligence types (R4-13). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RECOMMENDED_ACTIONS,
  RETURN_REASONS,
  RIE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";

export type ReturnsIntelligenceEngineVersion = "PILLOW-RIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ReturnReason = (typeof RETURN_REASONS)[number];
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];
export type RieCapability = (typeof RIE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ReturnsIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RieCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  ticketManagementEngineConnected: boolean;
  returnManagementEngineConnected: boolean;
  metadataVersion: string;
};

export type ReturnIntelligenceRecord = {
  returnIntelligenceId: string;
  timestamp: string;
  customerId: string;
  returnReference: string;
  orderReference: string;
  productReference: string;
  returnReason: ReturnReason;
  returnRiskScore: number;
  recommendedAction: RecommendedAction;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ReturnInsight = {
  insightId: string;
  timestamp: string;
  customerId: string;
  returnIntelligenceId: string;
  insightType: "history" | "pattern" | "risk" | "communication" | "lifecycle";
  summary: string;
  metadataVersion: string;
};

export type ReturnIntelligenceFailure = {
  failureId: string;
  timestamp: string;
  returnIntelligenceId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type ReturnIntelligenceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ReturnsIntelligenceRunReport = {
  returnsIntelligenceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_request"
    | "evaluate_eligibility"
    | "analyze_history"
    | "detect_abnormal"
    | "detect_repeat"
    | "recommend_decision"
    | "track_lifecycle"
    | "coordinate_communication"
    | "generate_insights"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: ReturnsIntelligenceEngineRecord;
  returnIntelligenceRecords: ReturnIntelligenceRecord[];
  insights: ReturnInsight[];
  failures: ReturnIntelligenceFailure[];
  validation: ReturnIntelligenceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ReturnsIntelligenceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ReturnIntelligenceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalReturnIntelligenceRecords: number;
  highRiskReturns: number;
  repeatPatternCustomers: number;
  activeInsights: number;
  failedRecords: number;
  notes: string[];
};

export type ReturnsIntelligencePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  requestsReceived: number;
  eligibilityEvaluations: number;
  historyAnalyses: number;
  abnormalDetected: number;
  repeatPatternsDetected: number;
  recommendationsGenerated: number;
  lifecycleTracked: number;
  communicationsCoordinated: number;
  insightsGenerated: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ReturnsIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ReturnIntelligenceValidationReport["decision"] | null;
  totalReturnIntelligenceRecords: number;
  highRiskReturns: number;
  activeInsights: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  returnManagementEngineConnected: boolean;
  recentLogs: string[];
};

export type RieLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectReturnsIntelligenceEngineInput = { forceReconnect?: boolean };

export type ReceiveReturnRequestInput = {
  customerId: string;
  orderReference: string;
  productReference?: string;
  returnReason: ReturnReason;
  returnReference?: string;
};

export type EvaluateReturnEligibilityInput = {
  customerId: string;
  orderReference: string;
  returnReason: ReturnReason;
};

export type AnalyzeReturnHistoryInput = {
  customerId: string;
};

export type DetectAbnormalReturnBehaviorInput = {
  customerId?: string;
};

export type DetectRepeatReturnPatternsInput = {
  customerId?: string;
};

export type RecommendReturnDecisionInput = {
  returnIntelligenceId: string;
};

export type TrackReturnLifecycleInput = {
  returnReference: string;
  customerId?: string;
};

export type CoordinateCustomerCommunicationsInput = {
  returnIntelligenceId: string;
  communicationSummary?: string;
};

export type GenerateReturnInsightsInput = {
  customerId?: string;
  returnIntelligenceId?: string;
};

export type DetectReturnFailuresInput = { returnIntelligenceId?: string };

export type ReturnsIntelligenceEngineState = {
  engineVersion: ReturnsIntelligenceEngineVersion;
  missionId: "R4-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: ReturnsIntelligenceEngineConfiguration;
  latestReport: ReturnsIntelligenceRunReport | null;
  engineRecord: ReturnsIntelligenceEngineRecord | null;
  health: ReturnsIntelligenceHealthReport;
  performance: ReturnsIntelligencePerformanceStats;
};
