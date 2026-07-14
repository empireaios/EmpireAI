/** T1-05 — Navigation graph validation. */

import { appendNavigationLog } from "./navigation-logging.js";
import type { NavigationGraph } from "./types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class NavigationValidator {
  validate(graph: NavigationGraph): ValidationResult {
    const errors: string[] = [];

    if (!graph.metadata.graphId) errors.push("Missing graphId");
    if (!graph.metadata.sourceLayoutId) errors.push("Missing sourceLayoutId");
    if (!graph.metadata.currentScreenId) errors.push("Missing currentScreenId");
    if (graph.nodes.length < 1) errors.push("No navigation nodes detected");

    for (const node of graph.nodes) {
      if (!node.nodeId) errors.push("Node missing nodeId");
      if (!node.identifier) errors.push(`Node ${node.nodeId} missing identifier`);
    }

    for (const edge of graph.edges) {
      if (!graph.nodes.some((n) => n.nodeId === edge.sourceNodeId)) {
        errors.push(`Edge ${edge.edgeId} references unknown source ${edge.sourceNodeId}`);
      }
      if (!graph.nodes.some((n) => n.nodeId === edge.destinationNodeId)) {
        errors.push(`Edge ${edge.edgeId} references unknown destination ${edge.destinationNodeId}`);
      }
    }

    const valid = errors.length === 0;
    appendNavigationLog({
      event: "navigation_validation",
      level: valid ? "info" : "warn",
      details: valid
        ? `Graph ${graph.metadata.graphId} validated · ${graph.nodes.length} nodes · ${graph.edges.length} edges`
        : errors.join("; "),
    });

    return { valid, errors };
  }
}
