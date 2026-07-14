/** T2-01 — Navigation rule evaluator. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { UxRule } from "./types.js";

export type NavigationEvaluationOutcome = {
  passed: boolean;
  description: string;
  evidence: Record<string, unknown>;
  sourceLayoutId: string | null;
  sourceNavigationNodeId: string | null;
  affectedScreenId: string | null;
  affectedRouteOrView: string | null;
};

export class NavigationRuleEvaluator {
  evaluate(rule: UxRule, graph: NavigationGraph | null): NavigationEvaluationOutcome {
    if (!graph) {
      return {
        passed: false,
        description: "No navigation data available for evaluation",
        evidence: { reason: "missing_navigation_data" },
        sourceLayoutId: null,
        sourceNavigationNodeId: null,
        affectedScreenId: null,
        affectedRouteOrView: null,
      };
    }

    const evaluator = rule.evaluationLogic.evaluator;
    const params = rule.evaluationLogic.parameters;
    const layoutId = graph.metadata.sourceLayoutId ?? null;
    const screenId = graph.metadata.currentScreenId ?? null;

    switch (evaluator) {
      case "navigation_min_nodes": {
        const minNodes = Number(params.minNodes ?? 1);
        return {
          passed: graph.nodes.length >= minNodes,
          description:
            graph.nodes.length >= minNodes
              ? `${graph.nodes.length} navigation nodes detected`
              : `Only ${graph.nodes.length} nodes (minimum ${minNodes})`,
          evidence: { nodeCount: graph.nodes.length, minNodes },
          sourceLayoutId: layoutId,
          sourceNavigationNodeId: graph.nodes[0]?.nodeId ?? null,
          affectedScreenId: screenId,
          affectedRouteOrView: graph.nodes[0]?.identifier ?? null,
        };
      }

      case "navigation_has_entry": {
        const hasEntry = graph.entryPoints.length > 0;
        return {
          passed: hasEntry,
          description: hasEntry
            ? `${graph.entryPoints.length} entry points defined`
            : "Navigation graph missing entry points",
          evidence: { entryPointCount: graph.entryPoints.length },
          sourceLayoutId: layoutId,
          sourceNavigationNodeId: graph.entryPoints[0] ?? graph.nodes[0]?.nodeId ?? null,
          affectedScreenId: screenId,
          affectedRouteOrView: null,
        };
      }

      default:
        return {
          passed: true,
          description: `Unknown navigation evaluator '${evaluator}' — skipped`,
          evidence: { evaluator, skipped: true },
          sourceLayoutId: layoutId,
          sourceNavigationNodeId: graph.nodes[0]?.nodeId ?? null,
          affectedScreenId: screenId,
          affectedRouteOrView: graph.nodes[0]?.identifier ?? null,
        };
    }
  }
}
