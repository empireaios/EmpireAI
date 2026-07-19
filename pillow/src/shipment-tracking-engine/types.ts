/** PILLOW-STE-001 — Shipment Tracking Engine types (R2-12). */

import type {
  DELAY_STATUSES,
  DELIVERY_MILESTONES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SUPPORTED_CARRIER_IDENTIFIERS,
  TRACKING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";

export type ShipmentTrackingEngineVersion = "PILLOW-STE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export type DeliveryMilestone = (typeof DELIVERY_MILESTONES)[number];
export type DelayStatus = (typeof DELAY_STATUSES)[number];
export type SupportedCarrierIdentifier = (typeof SUPPORTED_CARRIER_IDENTIFIERS)[number];

export type ShipmentTrackingRecord = {
  trackingRecordId: string;
  timestamp: string;
  shipmentId: string;
  carrierId: SupportedCarrierIdentifier;
  trackingNumber: string;
  orderReference: string;
  fulfilmentReference: string;
  currentShipmentStatus: TrackingStatus;
  currentLocation: string | null;
  deliveryMilestone: DeliveryMilestone;
  estimatedDeliveryDate: string | null;
  deliveredTimestamp: string | null;
  delayStatus: DelayStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type TrackingEvent = {
  eventId: string;
  shipmentId: string;
  trackingNumber: string;
  eventType: TrackingStatus;
  location: string | null;
  occurredAt: string;
  source: "api" | "webhook";
};

export type TrackingFailureFinding = {
  trackingRecordId: string;
  failureType: "missing_tracking" | "invalid_record" | "api_failure" | "duplicate_event";
  details: string;
};

export type InvalidTrackingFinding = {
  shipmentId: string;
  errors: string[];
};

export type TrackingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ShipmentTrackingReport = {
  trackingReportId: string;
  trackingTimestamp: string;
  action: "sync" | "query" | "webhook" | "validate";
  records: ShipmentTrackingRecord[];
  events: TrackingEvent[];
  failures: TrackingFailureFinding[];
  invalidRecords: InvalidTrackingFinding[];
  validation: TrackingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TrackingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  trackingCount: number;
  lastSyncAt: string | null;
  lastValidationDecision: TrackingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  trackingFailures: number;
  deliveredCount: number;
  delayedCount: number;
  failedDeliveryCount: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type TrackingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  syncRuns: number;
  recordsTracked: number;
  eventsProcessed: number;
  deliveredDetected: number;
  delayedDetected: number;
  failedDeliveriesDetected: number;
  trackingFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TrackingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ShipmentTrackingEngineState = {
  engineVersion: ShipmentTrackingEngineVersion;
  missionId: "R2-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: ShipmentTrackingEngineConfiguration;
  latestReport: ShipmentTrackingReport | null;
  records: ShipmentTrackingRecord[];
  health: TrackingHealthReport;
  performance: TrackingPerformanceStats;
};

export type TrackingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  trackingCount: number;
  lastSyncAt: string | null;
  lastDecision: TrackingValidationReport["decision"] | null;
  deliveredCount: number;
  delayedCount: number;
  failedDeliveryCount: number;
  recentLogs: string[];
};

export type SyncShipmentTrackingInput = {
  shipmentId?: string;
  trackingFixtureMode?: "none" | "in_transit" | "delivered" | "delayed" | "failed";
};

export type ReceiveTrackingWebhookInput = {
  shipmentId: string;
  trackingNumber: string;
  eventType: TrackingStatus;
  location?: string;
};

export type QueryCarrierTrackingInput = {
  shipmentId: string;
  trackingNumber?: string;
};
