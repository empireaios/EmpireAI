/** PILLOW-LPE-001 — Loyalty Programme Engine types (R4-12). */

import type {
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LOYALTY_ACTIVITY_TYPES,
  LOYALTY_TIERS,
  LPE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";

export type LoyaltyProgrammeEngineVersion = "PILLOW-LPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];
export type LoyaltyActivityType = (typeof LOYALTY_ACTIVITY_TYPES)[number];
export type LpeCapability = (typeof LPE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type LoyaltyEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LpeCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  sentimentEngineConnected: boolean;
  reviewManagementEngineConnected: boolean;
  metadataVersion: string;
};

export type LoyaltyProgramme = {
  loyaltyProgrammeId: string;
  timestamp: string;
  programmeName: string;
  programmeDescription: string;
  active: boolean;
  metadataVersion: string;
};

export type LoyaltyMember = {
  memberId: string;
  timestamp: string;
  customerId: string;
  loyaltyProgrammeId: string;
  loyaltyTier: LoyaltyTier;
  currentPointsBalance: number;
  metadataVersion: string;
};

export type LoyaltyRecord = {
  loyaltyRecordId: string;
  timestamp: string;
  customerId: string;
  loyaltyProgrammeId: string;
  loyaltyTier: LoyaltyTier;
  pointsEarned: number;
  pointsRedeemed: number;
  currentPointsBalance: number;
  rewardReference: string | null;
  activityType: LoyaltyActivityType;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LoyaltyReward = {
  rewardId: string;
  timestamp: string;
  customerId: string;
  loyaltyProgrammeId: string;
  loyaltyRecordId: string;
  rewardReference: string;
  pointsCost: number;
  description: string;
  metadataVersion: string;
};

export type LoyaltyAbuseAlert = {
  alertId: string;
  timestamp: string;
  customerId: string;
  loyaltyRecordId: string | null;
  abuseType: "duplicate_redemption" | "excessive_award" | "negative_balance" | "rapid_activity";
  severity: "low" | "medium" | "high";
  message: string;
  metadataVersion: string;
};

export type LoyaltyFailure = {
  failureId: string;
  timestamp: string;
  loyaltyRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type LoyaltyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LoyaltyRunReport = {
  loyaltyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_programme"
    | "register_member"
    | "award_points"
    | "redeem_points"
    | "manage_tier"
    | "track_balance"
    | "track_activity"
    | "detect_abuse"
    | "generate_rewards"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: LoyaltyEngineRecord;
  loyaltyRecords: LoyaltyRecord[];
  rewards: LoyaltyReward[];
  abuseAlerts: LoyaltyAbuseAlert[];
  failures: LoyaltyFailure[];
  validation: LoyaltyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LoyaltyHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LoyaltyValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalProgrammes: number;
  totalMembers: number;
  totalLoyaltyRecords: number;
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
  activeAbuseAlerts: number;
  failedRecords: number;
  notes: string[];
};

export type LoyaltyPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  programmesCreated: number;
  membersRegistered: number;
  pointsAwarded: number;
  pointsRedeemed: number;
  tiersUpdated: number;
  rewardsGenerated: number;
  abuseDetected: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LoyaltyCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: LoyaltyValidationReport["decision"] | null;
  totalProgrammes: number;
  totalMembers: number;
  totalLoyaltyRecords: number;
  activeAbuseAlerts: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  recentLogs: string[];
};

export type LpeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectLoyaltyProgrammeEngineInput = { forceReconnect?: boolean };

export type CreateLoyaltyProgrammeInput = {
  programmeName: string;
  programmeDescription?: string;
};

export type RegisterLoyaltyMemberInput = {
  customerId: string;
  loyaltyProgrammeId: string;
};

export type AwardLoyaltyPointsInput = {
  customerId: string;
  loyaltyProgrammeId: string;
  points: number;
  reason?: string;
};

export type RedeemLoyaltyPointsInput = {
  customerId: string;
  loyaltyProgrammeId: string;
  points: number;
  rewardReference?: string;
};

export type ManageLoyaltyTierInput = {
  customerId: string;
  loyaltyProgrammeId: string;
};

export type TrackLoyaltyBalanceInput = {
  customerId: string;
  loyaltyProgrammeId?: string;
};

export type TrackLoyaltyActivityInput = {
  customerId?: string;
  loyaltyProgrammeId?: string;
};

export type DetectLoyaltyAbuseInput = {
  customerId?: string;
  loyaltyRecordId?: string;
};

export type GenerateLoyaltyRewardsInput = {
  customerId: string;
  loyaltyProgrammeId: string;
  rewardReference: string;
  pointsCost: number;
  description?: string;
};

export type DetectLoyaltyFailuresInput = { loyaltyRecordId?: string };

export type LoyaltyProgrammeEngineState = {
  engineVersion: LoyaltyProgrammeEngineVersion;
  missionId: "R4-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: LoyaltyProgrammeEngineConfiguration;
  latestReport: LoyaltyRunReport | null;
  engineRecord: LoyaltyEngineRecord | null;
  health: LoyaltyHealthReport;
  performance: LoyaltyPerformanceStats;
};
