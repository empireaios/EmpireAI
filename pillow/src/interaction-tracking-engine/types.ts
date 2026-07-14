/** PILLOW-ITE-001 — Interaction Tracking Engine types (T1-06). */

import type { INTERACTION_TYPES, TRACKING_STATUSES } from "./paths.js";
import type { InteractionTrackingConfiguration } from "./configuration.js";

export type InteractionTrackingEngineVersion = "PILLOW-ITE-001";
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export type PointerPosition = {
  x: number;
  y: number;
};

export type InputChangeMetadata = {
  fieldId: string | null;
  masked: boolean;
  valueLength: number | null;
};

export type ScrollMetadata = {
  direction: "up" | "down" | "left" | "right";
  distance: number;
};

export type InteractionEvent = {
  eventId: string;
  sessionId: string;
  timestamp: string;
  interactionType: InteractionType;
  sourceComponentId: string | null;
  sourceLayoutRegionId: string | null;
  sourceNavigationNodeId: string | null;
  destinationNavigationNodeId: string | null;
  triggeredNavigationEdgeId: string | null;
  pointerPosition: PointerPosition | null;
  keyboardKey: string | null;
  inputFieldId: string | null;
  inputChange: InputChangeMetadata | null;
  scroll: ScrollMetadata | null;
  previousValue: string | null;
  newValue: string | null;
  currentScreenId: string | null;
  currentRouteId: string | null;
  confidence: number;
  metadataVersion: string;
};

export type RawInteractionInput = {
  interactionType: InteractionType;
  componentId?: string;
  layoutRegionId?: string;
  navigationNodeId?: string;
  destinationNavigationNodeId?: string;
  navigationEdgeId?: string;
  pointerX?: number;
  pointerY?: number;
  keyboardKey?: string;
  inputFieldId?: string;
  previousValue?: string;
  newValue?: string;
  scrollDirection?: ScrollMetadata["direction"];
  scrollDistance?: number;
  timestamp?: string;
};

export type InteractionSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: TrackingStatus;
  eventsRecorded: number;
  eventsFailed: number;
  lastEventAt: string | null;
  listenersAttached: number;
};

export type InteractionHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  trackingEnabled: boolean;
  isTracking: boolean;
  lastSuccessfulEventAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  eventsPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type InteractionPerformanceStats = {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  inferredEvents: number;
  ingestedEvents: number;
  maskedSensitiveEvents: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedPolls: number;
  uptimeMs: number;
};

export type InteractionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type InteractionTrackingState = {
  engineVersion: InteractionTrackingEngineVersion;
  missionId: "T1-06";
  status: TrackingStatus;
  initializedAt: string;
  configuration: InteractionTrackingConfiguration;
  activeSession: InteractionSessionState | null;
  recentEvents: InteractionEvent[];
  health: InteractionHealthReport;
  performance: InteractionPerformanceStats;
};

export type InteractionTrackingCockpitSnapshot = {
  trackingStatus: TrackingStatus;
  healthStatus: string;
  eventsRecorded: number;
  inferredEvents: number;
  ingestedEvents: number;
  maskedEvents: number;
  latestEventTimestamp: string | null;
  latestInteractionType: InteractionType | null;
  currentScreenId: string | null;
  recoveryAttempts: number;
  recentLogs: string[];
};
