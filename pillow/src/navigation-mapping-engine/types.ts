/** PILLOW-NME-001 — Navigation Mapping Engine types (T1-05). */

import type {
  MAPPING_STATUSES,
  NODE_KINDS,
  TRANSITION_TYPES,
} from "./paths.js";
import type { NavigationMappingConfiguration } from "./configuration.js";

export type NavigationMappingEngineVersion = "PILLOW-NME-001";
export type MappingStatus = (typeof MAPPING_STATUSES)[number];
export type NavigationNodeKind = (typeof NODE_KINDS)[number];
export type TransitionType = (typeof TRANSITION_TYPES)[number];

export type NavigationNode = {
  nodeId: string;
  kind: NavigationNodeKind;
  identifier: string;
  label: string | null;
  sourceLayoutId: string;
  relatedComponentIds: string[];
  parentNodeId: string | null;
  childNodeIds: string[];
  visibility: "visible" | "hidden" | "collapsed";
  active: boolean;
  firstObservedAt: string;
  lastObservedAt: string;
  confidence: number;
};

export type NavigationEdge = {
  edgeId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  triggerComponentId: string | null;
  transitionType: TransitionType;
  direction: "forward" | "backward" | "lateral" | "overlay" | null;
  firstObservedAt: string;
  lastObservedAt: string;
  observationCount: number;
  confidence: number;
};

export type NavigationRelationship = {
  relationshipId: string;
  type: "parent_child" | "modal" | "drawer" | "tab" | "breadcrumb" | "wizard";
  fromNodeId: string;
  toNodeId: string;
  confidence: number;
};

export type NavigationGraphMetadata = {
  timestamp: string;
  sessionId: string;
  graphId: string;
  sourceLayoutId: string;
  currentScreenId: string;
  currentRouteId: string | null;
  currentViewId: string | null;
  version: string;
  processingDurationMs: number;
  mappingStatus: MappingStatus;
  confidenceScore: number;
  error?: string;
};

export type NavigationChangeSummary = {
  hasChanges: boolean;
  screenChanged: boolean;
  routeChanged: boolean;
  viewChanged: boolean;
  modalOpened: string[];
  modalClosed: string[];
  drawerOpened: string[];
  drawerClosed: string[];
  tabsSwitched: string[];
  nodesAdded: string[];
  nodesRemoved: string[];
  edgesAdded: string[];
  previousScreenId: string | null;
  currentScreenId: string;
};

export type NavigationGraph = {
  metadata: NavigationGraphMetadata;
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  entryPoints: string[];
  destinations: string[];
  relationships: NavigationRelationship[];
  changeSummary: NavigationChangeSummary | null;
};

export type NavigationSessionState = {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: MappingStatus;
  graphsGenerated: number;
  graphsFailed: number;
  lastGraphAt: string | null;
  lastSourceLayoutId: string | null;
  lastScreenId: string | null;
};

export type NavigationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  mappingEnabled: boolean;
  isMapping: boolean;
  lastSuccessfulGraphAt: string | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  averageProcessingDurationMs: number;
  graphsPerMinute: number;
  backlogSize: number;
  notes: string[];
};

export type NavigationPerformanceStats = {
  totalMappings: number;
  successfulMappings: number;
  failedMappings: number;
  totalNodes: number;
  totalEdges: number;
  totalTransitions: number;
  averageProcessingDurationMs: number;
  peakProcessingDurationMs: number;
  skippedLayouts: number;
  uptimeMs: number;
};

export type NavigationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type NavigationMappingState = {
  engineVersion: NavigationMappingEngineVersion;
  missionId: "T1-05";
  status: MappingStatus;
  initializedAt: string;
  configuration: NavigationMappingConfiguration;
  activeSession: NavigationSessionState | null;
  latestGraph: NavigationGraph | null;
  previousGraph: NavigationGraph | null;
  cumulativeGraph: NavigationGraph | null;
  health: NavigationHealthReport;
  performance: NavigationPerformanceStats;
};

export type NavigationMappingCockpitSnapshot = {
  mappingStatus: MappingStatus;
  healthStatus: string;
  graphsGenerated: number;
  nodesMapped: number;
  edgesMapped: number;
  currentScreenId: string | null;
  currentRouteId: string | null;
  latestGraphTimestamp: string | null;
  transitionDetected: boolean;
  confidenceScore: number;
  recoveryAttempts: number;
  recentLogs: string[];
};
