/** PILLOW-RME-001 — Review Management Engine types (R4-11). */

import type {
  ALERT_STATUSES,
  HEALTH_STATUSES,
  MARKETPLACE_CHANNELS,
  REVIEW_SENTIMENTS,
  REVIEW_STATUSES,
  RME_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ReviewManagementEngineConfiguration } from "./configuration.js";

export type ReviewManagementEngineVersion = "PILLOW-RME-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type MarketplaceChannel = (typeof MARKETPLACE_CHANNELS)[number];
export type ReviewSentiment = (typeof REVIEW_SENTIMENTS)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type RmeCapability = (typeof RME_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ReviewEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RmeCapability[];
  identityEngineConnected: boolean;
  timelineEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  metadataVersion: string;
};

export type ReviewRecord = {
  reviewRecordId: string;
  timestamp: string;
  customerId: string;
  marketplaceReference: string;
  productReference: string;
  orderReference: string;
  reviewRating: number;
  reviewComment: string;
  reviewSentiment: ReviewSentiment;
  reviewStatus: ReviewStatus;
  alertStatus: AlertStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ReputationAlert = {
  alertId: string;
  timestamp: string;
  reviewRecordId: string;
  customerId: string;
  alertType: "negative_review" | "positive_review" | "reputation_decline" | "import_failure";
  severity: "low" | "medium" | "high";
  message: string;
  metadataVersion: string;
};

export type ReviewTrend = {
  trendId: string;
  timestamp: string;
  marketplaceReference: string;
  productReference: string;
  averageRating: number;
  averageSentimentScore: number;
  trendDirection: "improving" | "stable" | "declining";
  recordCount: number;
  metadataVersion: string;
};

export type ReviewFailure = {
  failureId: string;
  timestamp: string;
  reviewRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type ReviewValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ReviewRunReport = {
  reviewRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "collect_review"
    | "import_marketplace_review"
    | "classify_sentiment"
    | "detect_negative"
    | "detect_positive"
    | "track_trends"
    | "generate_alerts"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: ReviewEngineRecord;
  reviewRecords: ReviewRecord[];
  alerts: ReputationAlert[];
  trends: ReviewTrend[];
  failures: ReviewFailure[];
  validation: ReviewValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ReviewHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ReviewValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalReviewRecords: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  activeAlerts: number;
  failedRecords: number;
  notes: string[];
};

export type ReviewPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  reviewsCollected: number;
  reviewsImported: number;
  sentimentsClassified: number;
  negativeDetected: number;
  positiveDetected: number;
  trendsTracked: number;
  alertsGenerated: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ReviewCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ReviewValidationReport["decision"] | null;
  totalReviewRecords: number;
  positiveReviews: number;
  negativeReviews: number;
  activeAlerts: number;
  identityEngineConnected: boolean;
  timelineEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  aiCustomerSupportConnected: boolean;
  recentLogs: string[];
};

export type RmeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectReviewManagementEngineInput = { forceReconnect?: boolean };

export type CollectCustomerReviewInput = {
  customerId: string;
  marketplaceReference: MarketplaceChannel | string;
  productReference: string;
  orderReference?: string;
  reviewRating: number;
  reviewComment?: string;
};

export type ImportMarketplaceReviewInput = {
  customerId: string;
  marketplaceReference: MarketplaceChannel | string;
  productReference: string;
  orderReference: string;
  externalReviewId: string;
  reviewRating: number;
  reviewComment: string;
};

export type ClassifyReviewSentimentInput = { reviewRecordId: string };
export type DetectNegativeReviewsInput = { customerId?: string; reviewRecordId?: string };
export type DetectPositiveReviewsInput = { customerId?: string; reviewRecordId?: string };
export type TrackReviewTrendsInput = {
  marketplaceReference?: string;
  productReference?: string;
};
export type GenerateReputationAlertsInput = { reviewRecordId?: string };
export type DetectReviewFailuresInput = { reviewRecordId?: string };

export type ReviewManagementEngineState = {
  engineVersion: ReviewManagementEngineVersion;
  missionId: "R4-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: ReviewManagementEngineConfiguration;
  latestReport: ReviewRunReport | null;
  engineRecord: ReviewEngineRecord | null;
  health: ReviewHealthReport;
  performance: ReviewPerformanceStats;
};
