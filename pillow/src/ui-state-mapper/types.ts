/** PILLOW-USM-001 — UI State Mapper types (T1-02). */

import type { MAPPING_STATUSES, SERIALIZATION_FORMATS } from "./paths.js";
import type { UiStateMapperConfiguration } from "./configuration.js";

export type UiStateMapperEngineVersion = "PILLOW-USM-001";
export type MappingStatus = (typeof MAPPING_STATUSES)[number];
export type SerializationFormat = (typeof SERIALIZATION_FORMATS)[number];

export type RegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UiRegion = {
  regionId: string;
  parentRegionId: string | null;
  bounds: RegionBounds;
  contentSignature: string;
  visibility: "visible" | "hidden";
};

export type UiHierarchyNode = {
  regionId: string;
  children: string[];
};

export type UiScreenState = {
  screenId: string;
  dimensions: { width: number; height: number };
  viewport: { width: number; height: number };
  regions: UiRegion[];
  hierarchy: UiHierarchyNode[];
};

export type StateChangeKind = "appeared" | "disappeared" | "modified" | "unchanged";

export type RegionChange = {
  regionId: string;
  kind: StateChangeKind;
  previousSignature: string | null;
  currentSignature: string | null;
};

export type StateChangeSummary = {
  hasChanges: boolean;
  appeared: string[];
  disappeared: string[];
  modified: string[];
  unchanged: string[];
  changes: RegionChange[];
};

export type UiStateMetadata = {
  timestamp: string;
  sessionId: string;
  sourceFrameId: string;
  stateId: string;
  version: string;
  screenResolution: { width: number; height: number };
  viewport: { width: number; height: number };
  processingDurationMs: number;
  mappingStatus: MappingStatus;
  error?: string;
};

export type UiStateModel = {
  metadata: UiStateMetadata;
  screen: UiScreenState;
  changeSummary: StateChangeSummary | null;
  serialized: string;
};

export type MappingSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: MappingStatus;
  statesGenerated: number;
  statesFailed: number;
  lastStateAt: string | null;
  lastSourceFrameNumber: number | null;
};

export type MappingHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  mappingEnabled: boolean;
  isMapping: boolean;
  lastSuccessfulMappingAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  statesPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type MappingPerformanceStats = {
  totalStates: number;
  successfulStates: number;
  failedStates: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedFrames: number;
  uptimeMs: number;
};

export type MappingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type UiStateMapperState = {
  engineVersion: UiStateMapperEngineVersion;
  missionId: "T1-02";
  status: MappingStatus;
  initializedAt: string;
  configuration: UiStateMapperConfiguration;
  activeSession: MappingSessionState | null;
  latestState: UiStateModel | null;
  previousState: UiStateModel | null;
  health: MappingHealthReport;
  performance: MappingPerformanceStats;
};

export type UiStateMapperCockpitSnapshot = {
  mappingStatus: MappingStatus;
  healthStatus: string;
  statesGenerated: number;
  latestStateTimestamp: string | null;
  viewportDimensions: string;
  regionCount: number;
  changeDetected: boolean;
  serializationFormat: SerializationFormat;
  recoveryAttempts: number;
  recentLogs: string[];
};
