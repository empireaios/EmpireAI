/** PILLOW-LUE-001 — Layout Understanding Engine types (T1-04). */

import type {
  ALIGNMENT_TYPES,
  LAYOUT_STATUSES,
  SPATIAL_RELATIONS,
  STRUCTURAL_REGION_TYPES,
} from "./paths.js";
import type { LayoutUnderstandingConfiguration } from "./configuration.js";

export type LayoutUnderstandingEngineVersion = "PILLOW-LUE-001";
export type LayoutStatus = (typeof LAYOUT_STATUSES)[number];
export type StructuralRegionType = (typeof STRUCTURAL_REGION_TYPES)[number];
export type SpatialRelation = (typeof SPATIAL_RELATIONS)[number];
export type AlignmentType = (typeof ALIGNMENT_TYPES)[number];

export type RegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StructuralRegion = {
  regionId: string;
  regionType: StructuralRegionType;
  bounds: RegionBounds;
  componentIds: string[];
  parentRegionId: string | null;
  childRegionIds: string[];
  confidence: number;
};

export type SpatialRelationship = {
  fromId: string;
  toId: string;
  relation: SpatialRelation;
  distance: number;
};

export type AlignmentRelationship = {
  componentIds: string[];
  alignment: AlignmentType;
  axis: "horizontal" | "vertical";
  tolerance: number;
};

export type GroupingRelationship = {
  groupId: string;
  componentIds: string[];
  groupType: "row" | "column" | "cluster";
  bounds: RegionBounds;
};

export type StackingEntry = {
  id: string;
  zIndex: number;
  layer: "base" | "overlay" | "modal";
};

export type ResponsiveBreakpoint = {
  name: string;
  viewportWidth: number;
  viewportHeight: number;
  matched: boolean;
};

export type LayoutChangeSummary = {
  hasChanges: boolean;
  regionsAppeared: string[];
  regionsDisappeared: string[];
  regionsModified: string[];
  responsiveChanged: boolean;
  previousViewport: { width: number; height: number } | null;
  currentViewport: { width: number; height: number };
};

export type LayoutMetadata = {
  timestamp: string;
  sessionId: string;
  sourceStateId: string;
  sourceComponentSetId: string;
  layoutId: string;
  version: string;
  screenId: string | null;
  viewport: { width: number; height: number };
  processingDurationMs: number;
  layoutStatus: LayoutStatus;
  confidenceScore: number;
  error?: string;
};

export type LayoutModel = {
  metadata: LayoutMetadata;
  regions: StructuralRegion[];
  regionHierarchy: { regionId: string; children: string[] }[];
  componentToRegion: Record<string, string>;
  spatialRelationships: SpatialRelationship[];
  alignmentRelationships: AlignmentRelationship[];
  groupingRelationships: GroupingRelationship[];
  stackingOrder: StackingEntry[];
  responsiveBreakpoints: ResponsiveBreakpoint[];
  changeSummary: LayoutChangeSummary | null;
};

export type LayoutSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: LayoutStatus;
  layoutsGenerated: number;
  layoutsFailed: number;
  lastLayoutAt: string | null;
  lastSourceStateId: string | null;
};

export type LayoutHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  layoutEnabled: boolean;
  isAnalyzing: boolean;
  lastSuccessfulLayoutAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  layoutsPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type LayoutPerformanceStats = {
  totalLayouts: number;
  successfulLayouts: number;
  failedLayouts: number;
  totalRegionsDetected: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedRecognitions: number;
  uptimeMs: number;
};

export type LayoutLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LayoutUnderstandingState = {
  engineVersion: LayoutUnderstandingEngineVersion;
  missionId: "T1-04";
  status: LayoutStatus;
  initializedAt: string;
  configuration: LayoutUnderstandingConfiguration;
  activeSession: LayoutSessionState | null;
  latestLayout: LayoutModel | null;
  previousLayout: LayoutModel | null;
  health: LayoutHealthReport;
  performance: LayoutPerformanceStats;
};

export type LayoutUnderstandingCockpitSnapshot = {
  layoutStatus: LayoutStatus;
  healthStatus: string;
  layoutsGenerated: number;
  regionsDetected: number;
  latestLayoutTimestamp: string | null;
  regionTypeCounts: Record<string, number>;
  changeDetected: boolean;
  confidenceScore: number;
  recoveryAttempts: number;
  recentLogs: string[];
};
