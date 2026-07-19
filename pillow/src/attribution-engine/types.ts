/** PILLOW-ATT-001 — Attribution Engine types (R5-09). */

import type {
  ATT_CAPABILITIES,
  ATTRIBUTION_MODELS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AttributionEngineConfiguration } from "./configuration.js";

export type AttributionEngineVersion = "PILLOW-ATT-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];
export type AttributionModel = (typeof ATTRIBUTION_MODELS)[number];
export type AttCapability = (typeof ATT_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AttributionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AttCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    marketingFramework: boolean;
    metaAds: boolean;
    googleAds: boolean;
    tiktokAds: boolean;
    youtubeAds: boolean;
    campaignManager: boolean;
    audienceIntelligence: boolean;
  };
  metadataVersion: string;
};

export type TouchpointRecord = {
  touchpointId: string;
  timestamp: string;
  customerRef: string;
  marketingChannel: MarketingChannel;
  campaignReference: string | null;
  advertisementReference: string | null;
  sequenceIndex: number;
  sourceLabel: string;
  piiRedacted: true;
};

export type AttributionRecord = {
  attributionRecordId: string;
  timestamp: string;
  customerId: string;
  campaignReference: string | null;
  marketingChannel: MarketingChannel;
  touchpointSequence: string[];
  attributionModel: AttributionModel;
  attributionValue: number;
  roiContribution: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  conversionValue: number;
  piiRedacted: true;
};

export type ContributionBreakdown = {
  key: string;
  contributionPercent: number;
  attributedValue: number;
  touchpointCount: number;
};

export type RoiSnapshot = {
  spend: number;
  revenue: number;
  roas: number;
  marketingRoiPercent: number;
  model: AttributionModel;
};

export type AttributionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AttributionRunReport = {
  attributionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "track_acquisition_source"
    | "track_touchpoint"
    | "track_conversion_journey"
    | "measure_campaign_contribution"
    | "measure_channel_contribution"
    | "measure_advertisement_contribution"
    | "attribute"
    | "calculate_roas"
    | "calculate_marketing_roi";
  engineRecord: AttributionEngineRecord;
  attributionRecords: AttributionRecord[];
  touchpoints: TouchpointRecord[];
  contributions: ContributionBreakdown[];
  roi: RoiSnapshot | null;
  validation: AttributionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AttributionHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: AttributionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalAttributions: number;
  totalTouchpoints: number;
  averageRoiContribution: number;
  notes: string[];
};

export type AttributionPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  touchpointsTracked: number;
  attributionsCalculated: number;
  roiCalculations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AttributionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AttributionEngineState = {
  engineVersion: AttributionEngineVersion;
  missionId: "R5-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: AttributionEngineConfiguration;
  latestReport: AttributionRunReport | null;
  engineRecord: AttributionEngineRecord | null;
  health: AttributionHealthReport;
  performance: AttributionPerformanceStats;
};

export type AttributionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AttributionValidationReport["decision"] | null;
  attributionsCalculated: number;
  touchpointsTracked: number;
  averageRoiContribution: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectAttributionEngineInput = {
  forceReconnect?: boolean;
};

export type TrackAcquisitionSourceInput = {
  customerRef: string;
  marketingChannel: MarketingChannel;
  campaignReference?: string;
  sourceLabel?: string;
};

export type TrackTouchpointInput = {
  customerRef: string;
  marketingChannel: MarketingChannel;
  campaignReference?: string;
  advertisementReference?: string;
  sourceLabel?: string;
  timestamp?: string;
};

export type TrackConversionJourneyInput = {
  customerRef: string;
  conversionValue: number;
  attributionModel?: AttributionModel;
  campaignReference?: string;
};

export type MeasureContributionInput = {
  customerRef?: string;
  attributionModel?: AttributionModel;
};

export type AttributeInput = {
  customerRef: string;
  conversionValue: number;
  attributionModel?: AttributionModel;
  campaignReference?: string;
};

export type CalculateRoiInput = {
  spend?: number;
  revenue?: number;
  attributionModel?: AttributionModel;
  customerRef?: string;
};
