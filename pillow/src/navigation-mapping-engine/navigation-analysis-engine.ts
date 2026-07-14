/** T1-05 — Per-layout navigation mapping pipeline. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationMappingConfiguration } from "./configuration.js";
import { ScreenIdentityEngine } from "./screen-identity-rules.js";
import { RouteStateDetector, type RouteState } from "./route-state-detector.js";
import { NavigationEntryDetector } from "./navigation-entry-rules.js";
import { TransitionMapper } from "./transition-mapper.js";
import { NavigationRelationshipMapper } from "./navigation-relationship-mapper.js";
import {
  NavigationGraphBuilder,
  buildDestinations,
  buildEntryPoints,
} from "./navigation-graph-builder.js";
import { detectNavigationChanges } from "./navigation-change-detector.js";
import { buildGraphId, buildNavigationMetadata } from "./navigation-metadata-generator.js";
import { NavigationValidator } from "./navigation-validator.js";
import { appendNavigationLog } from "./navigation-logging.js";
import type { NavigationGraph } from "./types.js";

export type NavigationAnalysisInput = {
  layout: LayoutModel;
  sessionId: string;
  graphSequence: number;
  previousGraph: NavigationGraph | null;
  previousLayout: LayoutModel | null;
  previousRouteState: RouteState | null;
  config: NavigationMappingConfiguration;
};

export type NavigationAnalysisResult = {
  graph: NavigationGraph | null;
  routeState: RouteState | null;
  error?: string;
};

export class NavigationAnalysisEngine {
  private readonly screenIdentity = new ScreenIdentityEngine();
  private readonly routeDetector = new RouteStateDetector();
  private readonly entryDetector = new NavigationEntryDetector();
  private readonly transitionMapper = new TransitionMapper();
  private readonly relationshipMapper = new NavigationRelationshipMapper();
  private readonly graphBuilder = new NavigationGraphBuilder();
  private readonly validator = new NavigationValidator();

  analyze(input: NavigationAnalysisInput): NavigationAnalysisResult {
    const started = Date.now();
    try {
      if (!input.layout?.metadata?.layoutId) {
        return { graph: null, routeState: null, error: "Invalid layout model" };
      }

      const identity = this.screenIdentity.identify(input.layout, input.config.screenIdentityRules);
      const routeState = this.routeDetector.detect(identity, input.previousRouteState);

      if (identity.confidence < input.config.confidenceThreshold) {
        return {
          graph: null,
          routeState,
          error: `Confidence ${identity.confidence} below threshold ${input.config.confidenceThreshold}`,
        };
      }

      const navRegions = input.layout.regions.filter((r) =>
        input.config.navigationComponentRules.some((rule) => rule.regionType === r.regionType),
      );
      const entries = this.entryDetector.detect(navRegions, input.config.navigationComponentRules);

      const currentScreenNodeId = `nav-node-screen-${identity.screenId}`;
      const previousScreenNodeId = input.previousRouteState
        ? `nav-node-screen-${input.previousRouteState.screenId}`
        : null;

      const transitions = input.config.transitionDetectionEnabled
        ? [
            ...this.transitionMapper.map(
              input.layout,
              identity,
              routeState,
              previousScreenNodeId,
              currentScreenNodeId,
            ),
            ...this.transitionMapper.detectTabSwitch(input.layout, input.previousLayout),
          ]
        : [];

      const graphId = buildGraphId(input.sessionId, input.graphSequence);
      const preliminaryNodes = this.graphBuilder.buildSnapshot({
        layout: input.layout,
        identity,
        entries,
        transitions: [],
        relationships: [],
        graphId,
        sessionId: input.sessionId,
        merge: false,
      });

      const relationships = this.relationshipMapper.map(
        input.layout,
        preliminaryNodes.nodes,
        entries,
      );

      const { nodes, edges, relationships: mergedRels } = this.graphBuilder.buildSnapshot({
        layout: input.layout,
        identity,
        entries,
        transitions,
        relationships,
        graphId,
        sessionId: input.sessionId,
        merge: input.config.graphUpdateMerge,
      });

      const metadata = buildNavigationMetadata({
        sessionId: input.sessionId,
        graphId,
        sourceLayoutId: input.layout.metadata.layoutId,
        identity,
        processingDurationMs: Date.now() - started,
        mappingStatus: "mapping",
        confidenceScore: identity.confidence,
      });

      const partial: NavigationGraph = {
        metadata,
        nodes,
        edges,
        entryPoints: buildEntryPoints(nodes),
        destinations: buildDestinations(nodes),
        relationships: mergedRels,
        changeSummary: null,
      };

      partial.changeSummary = detectNavigationChanges({
        previousGraph: input.previousGraph,
        currentGraph: partial,
        identity,
        routeState,
        layout: input.layout,
        previousLayout: input.previousLayout,
      });

      if (input.config.validateGraphs) {
        const validation = this.validator.validate(partial);
        if (!validation.valid) {
          return { graph: null, routeState, error: validation.errors.join("; ") };
        }
      }

      partial.metadata.processingDurationMs = Date.now() - started;

      if (routeState.screenChanged) {
        appendNavigationLog({
          event: "screen_identity_change",
          level: "info",
          details: `${routeState.previousScreenId ?? "none"} → ${identity.screenId}`,
        });
      }
      if (routeState.routeChanged) {
        appendNavigationLog({
          event: "route_change",
          level: "info",
          details: `${routeState.previousRouteId ?? "none"} → ${identity.routeId}`,
        });
      }

      appendNavigationLog({
        event: "graph_update",
        level: "info",
        details: `Graph ${graphId} · ${nodes.length} nodes · ${edges.length} edges`,
      });

      return { graph: partial, routeState };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Navigation mapping failed";
      return { graph: null, routeState: null, error: message };
    }
  }

  getCumulativeGraph(): NavigationGraph | null {
    const snap = this.graphBuilder.getCumulativeSnapshot();
    if (snap.nodes.length === 0) return null;
    const now = new Date().toISOString();
    return {
      metadata: {
        timestamp: now,
        sessionId: "cumulative",
        graphId: "nav-graph-cumulative",
        sourceLayoutId: snap.nodes[snap.nodes.length - 1]?.sourceLayoutId ?? "",
        currentScreenId: snap.nodes.find((n) => n.active && (n.kind === "screen" || n.kind === "view"))?.identifier ?? "",
        currentRouteId: null,
        currentViewId: null,
        version: "1.0.0",
        processingDurationMs: 0,
        mappingStatus: "mapping",
        confidenceScore: 0.75,
      },
      nodes: snap.nodes,
      edges: snap.edges,
      entryPoints: buildEntryPoints(snap.nodes),
      destinations: buildDestinations(snap.nodes),
      relationships: snap.relationships,
      changeSummary: null,
    };
  }

  resetGraph(): void {
    this.graphBuilder.reset();
  }
}
