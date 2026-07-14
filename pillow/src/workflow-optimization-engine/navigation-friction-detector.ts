/** T2-05 — Navigation friction detection. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class NavigationFrictionDetector {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    navigation: NavigationGraph | null,
    context: WorkflowContextModel | null,
    enabled: boolean,
  ): WorkflowFrictionPoint[] {
    if (!enabled) return [];
    const findings: WorkflowFrictionPoint[] = [];

    if (!navigation) {
      if (context?.activeNavigationNodeId) {
        findings.push({
          frictionId: this.metadata.buildFrictionId("unclear_next_action"),
          category: "unclear_next_action",
          description: "Active navigation context without navigation graph data",
          severity: "info",
          affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
          affectedComponents: [],
          affectedNavigationNodes: [context.activeNavigationNodeId],
          evidenceRef: context.contextId,
          confidence: 0.5,
        });
      }
      return findings;
    }

    const leafNodes = navigation.nodes.filter(
      (n) => n.childNodeIds.length === 0 && n.kind !== "nav_item",
    );
    const deadEnds = leafNodes.filter(
      (n) => !navigation.destinations.includes(n.nodeId) && !navigation.entryPoints.includes(n.nodeId),
    );
    if (deadEnds.length > 0) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("dead_end"),
        category: "dead_end",
        description: `${deadEnds.length} navigation dead end(s) detected`,
        severity: "warning",
        affectedScreens: deadEnds.map((n) => n.identifier).filter(Boolean),
        affectedComponents: deadEnds.flatMap((n) => n.relatedComponentIds),
        affectedNavigationNodes: deadEnds.map((n) => n.nodeId),
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.7,
      });
    }

    if (navigation.edges.length > navigation.nodes.length * 1.5) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("excessive_navigation"),
        category: "excessive_navigation",
        description: "Navigation graph has high edge-to-node ratio suggesting complex routing",
        severity: "info",
        affectedScreens: [navigation.metadata.currentScreenId],
        affectedComponents: [],
        affectedNavigationNodes: navigation.nodes.slice(0, 5).map((n) => n.nodeId),
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.6,
      });
    }

    return findings;
  }
}
