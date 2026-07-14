/** T1-05 — Navigation graph metadata generation. */

import { NAVIGATION_GRAPH_VERSION } from "./paths.js";
import type { MappingStatus } from "./types.js";
import type { ScreenIdentity } from "./screen-identity-rules.js";

export function buildGraphId(sessionId: string, sequence: number): string {
  return `nav-graph-${sessionId}-${sequence}`;
}

export function buildNavigationMetadata(input: {
  sessionId: string;
  graphId: string;
  sourceLayoutId: string;
  identity: ScreenIdentity;
  processingDurationMs: number;
  mappingStatus: MappingStatus;
  confidenceScore: number;
}) {
  return {
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId,
    graphId: input.graphId,
    sourceLayoutId: input.sourceLayoutId,
    currentScreenId: input.identity.screenId,
    currentRouteId: input.identity.routeId,
    currentViewId: input.identity.viewId,
    version: NAVIGATION_GRAPH_VERSION,
    processingDurationMs: input.processingDurationMs,
    mappingStatus: input.mappingStatus,
    confidenceScore: Math.round(input.confidenceScore * 100) / 100,
  };
}
