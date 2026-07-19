/** PILLOW-CSEG-001 — Customer Segmentation Engine types (R4-16). */

import type {
  BEHAVIOUR_PROFILES,
  CSEG_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RISK_TIERS,
  SEGMENT_TYPES,
  VALIDATION_STATUSES,
  VALUE_TIERS,
} from "./paths.js";
import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";

export type CustomerSegmentationEngineVersion = "PILLOW-CSEG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type SegmentType = (typeof SEGMENT_TYPES)[number];
export type ValueTier = (typeof VALUE_TIERS)[number];
export type RiskTier = (typeof RISK_TIERS)[number];
export type BehaviourProfile = (typeof BEHAVIOUR_PROFILES)[number];
export type CsegCapability = (typeof CSEG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type SegmentationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CsegCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  loyaltyProgrammeEngineConnected: boolean;
  customerRiskEngineConnected: boolean;
  customerLifetimeValueEngineConnected: boolean;
  metadataVersion: string;
};

export type CustomerSegment = {
  segmentId: string;
  timestamp: string;
  segmentName: string;
  segmentType: SegmentType;
  description: string;
  active: boolean;
  metadataVersion: string;
};

export type SegmentationRecord = {
  segmentationRecordId: string;
  timestamp: string;
  customerId: string;
  assignedSegments: string[];
  behaviourProfile: BehaviourProfile;
  loyaltyTier: string;
  customerValueTier: ValueTier;
  riskTier: RiskTier;
  segmentConfidence: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SegmentChange = {
  changeId: string;
  timestamp: string;
  customerId: string;
  segmentationRecordId: string;
  previousSegments: string[];
  newSegments: string[];
  metadataVersion: string;
};

export type SegmentationFailure = {
  failureId: string;
  timestamp: string;
  segmentationRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type SegmentationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SegmentationRunReport = {
  segmentationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_segment"
    | "assign_segments"
    | "segment_demographics"
    | "segment_purchasing"
    | "segment_value"
    | "segment_loyalty"
    | "segment_sentiment"
    | "segment_risk"
    | "detect_changes"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: SegmentationEngineRecord;
  segments: CustomerSegment[];
  segmentationRecords: SegmentationRecord[];
  segmentChanges: SegmentChange[];
  failures: SegmentationFailure[];
  validation: SegmentationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SegmentationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SegmentationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalSegmentationRecords: number;
  activeSegments: number;
  segmentChangesDetected: number;
  failedRecords: number;
  notes: string[];
};

export type SegmentationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  segmentsCreated: number;
  assignmentsPerformed: number;
  demographicSegmentations: number;
  purchasingSegmentations: number;
  valueSegmentations: number;
  loyaltySegmentations: number;
  sentimentSegmentations: number;
  riskSegmentations: number;
  changesDetected: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SegmentationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: SegmentationValidationReport["decision"] | null;
  totalSegmentationRecords: number;
  activeSegments: number;
  segmentChangesDetected: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  recentLogs: string[];
};

export type CsegLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectSegmentationEngineInput = { forceReconnect?: boolean };
export type CreateCustomerSegmentInput = {
  segmentName: string;
  segmentType: SegmentType;
  description?: string;
};
export type AssignCustomerToSegmentsInput = { customerId: string };
export type SegmentCustomerInput = { customerId: string };
export type DetectSegmentChangesInput = { customerId?: string };
export type DetectSegmentationFailuresInput = { segmentationRecordId?: string };

export type CustomerSegmentationEngineState = {
  engineVersion: CustomerSegmentationEngineVersion;
  missionId: "R4-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerSegmentationEngineConfiguration;
  latestReport: SegmentationRunReport | null;
  engineRecord: SegmentationEngineRecord | null;
  health: SegmentationHealthReport;
  performance: SegmentationPerformanceStats;
};

export type CustomerSegmentSignals = {
  customerOwner: string | null;
  hasEmail: boolean;
  purchaseCount: number;
  timelineEventCount: number;
  lifetimeValue: number;
  loyaltyTier: string;
  loyaltyPoints: number;
  avgSentimentScore: number;
  negativeSentimentCount: number;
  riskScore: number;
  riskLevel: string;
};

export type SegmentationClassification = {
  assignedSegments: string[];
  behaviourProfile: BehaviourProfile;
  loyaltyTier: string;
  customerValueTier: ValueTier;
  riskTier: RiskTier;
  segmentConfidence: number;
};
