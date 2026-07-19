/** PILLOW-CJI-001 — Customer Journey Intelligence types (R4-17). */

import type {
  CJI_CAPABILITIES,
  CONVERSION_STATUSES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  JOURNEY_STAGES,
  RECOMMENDED_JOURNEY_ACTIONS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";

export type CustomerJourneyIntelligenceVersion = "PILLOW-CJI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type JourneyStage = (typeof JOURNEY_STAGES)[number];
export type ConversionStatus = (typeof CONVERSION_STATUSES)[number];
export type RecommendedJourneyAction = (typeof RECOMMENDED_JOURNEY_ACTIONS)[number];
export type CjiCapability = (typeof CJI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type JourneyIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CjiCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  customerLifetimeValueEngineConnected: boolean;
  customerSegmentationEngineConnected: boolean;
  metadataVersion: string;
};

export type JourneyRecord = {
  journeyRecordId: string;
  timestamp: string;
  customerId: string;
  journeyStage: JourneyStage;
  touchpointReferences: string[];
  conversionStatus: ConversionStatus;
  frictionIndicators: string[];
  journeyScore: number;
  recommendedActions: RecommendedJourneyAction[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type JourneyInsight = {
  insightId: string;
  timestamp: string;
  customerId: string;
  journeyRecordId: string;
  insightType: "dropoff" | "friction" | "optimization" | "prediction";
  message: string;
  metadataVersion: string;
};

export type JourneyFailure = {
  failureId: string;
  timestamp: string;
  journeyRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type JourneyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type JourneyRunReport = {
  journeyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "map_journey"
    | "track_touchpoints"
    | "identify_stages"
    | "detect_dropoff"
    | "detect_friction"
    | "measure_performance"
    | "measure_conversion"
    | "recommend_improvements"
    | "predict_progression"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: JourneyIntelligenceEngineRecord;
  journeyRecords: JourneyRecord[];
  insights: JourneyInsight[];
  failures: JourneyFailure[];
  validation: JourneyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type JourneyHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: JourneyValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalJourneyRecords: number;
  activeInsights: number;
  dropOffDetected: number;
  failedRecords: number;
  notes: string[];
};

export type JourneyPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  journeysMapped: number;
  touchpointsTracked: number;
  stagesIdentified: number;
  dropOffsDetected: number;
  frictionPointsDetected: number;
  performanceMeasurements: number;
  conversionMeasurements: number;
  recommendationsGenerated: number;
  predictionsGenerated: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type JourneyCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: JourneyValidationReport["decision"] | null;
  totalJourneyRecords: number;
  activeInsights: number;
  dropOffDetected: number;
  identityEngineConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type CjiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectJourneyIntelligenceInput = { forceReconnect?: boolean };
export type MapCustomerJourneyInput = { customerId: string };
export type TrackCustomerTouchpointsInput = { customerId: string };
export type IdentifyJourneyStagesInput = { customerId: string };
export type DetectDropOffPointsInput = { customerId: string };
export type DetectFrictionPointsInput = { customerId: string };
export type MeasureJourneyPerformanceInput = { customerId: string };
export type MeasureConversionRatesInput = { customerId?: string };
export type RecommendJourneyImprovementsInput = { customerId: string };
export type PredictCustomerProgressionInput = { customerId: string };
export type DetectJourneyFailuresInput = { journeyRecordId?: string };

export type CustomerJourneyIntelligenceState = {
  engineVersion: CustomerJourneyIntelligenceVersion;
  missionId: "R4-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerJourneyIntelligenceConfiguration;
  latestReport: JourneyRunReport | null;
  engineRecord: JourneyIntelligenceEngineRecord | null;
  health: JourneyHealthReport;
  performance: JourneyPerformanceStats;
};

export type CustomerJourneySignals = {
  touchpointReferences: string[];
  purchaseCount: number;
  supportCount: number;
  communicationCount: number;
  timelineEventCount: number;
  avgSentimentScore: number;
  negativeSentimentCount: number;
  lifetimeValue: number;
  assignedSegments: string[];
  daysSinceLastEvent: number;
};

export type JourneyAnalysis = {
  journeyStage: JourneyStage;
  conversionStatus: ConversionStatus;
  frictionIndicators: string[];
  journeyScore: number;
  recommendedActions: RecommendedJourneyAction[];
};
