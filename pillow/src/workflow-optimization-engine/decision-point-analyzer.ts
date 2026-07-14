/** T2-05 — Decision point analysis. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowFrictionPoint } from "./types.js";

export class DecisionPointAnalyzer {
  private readonly metadata = new WorkflowMetadataGenerator();

  analyze(
    context: WorkflowContextModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
  ): WorkflowFrictionPoint[] {
    const findings: WorkflowFrictionPoint[] = [];

    if (context?.contextState === "modal_decision") {
      findings.push({
        frictionId: this.metadata.buildFrictionId("unclear_decision_point"),
        category: "unclear_decision_point",
        description: "Workflow context indicates pending decision without clear resolution",
        severity: "warning",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context.activeComponentIds,
        affectedNavigationNodes: context.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context.contextId,
        confidence: context.confidence,
      });
    }

    if (context && !context.currentUserTask && context.activeComponentIds.length > 3) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("unclear_next_action"),
        category: "unclear_next_action",
        description: "Multiple active components without defined user task",
        severity: "info",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        affectedComponents: context.activeComponentIds,
        affectedNavigationNodes: context.activeNavigationNodeId
          ? [context.activeNavigationNodeId]
          : [],
        evidenceRef: context.contextId,
        confidence: 0.6,
      });
    }

    const weakPrimary = layoutEvaluation?.layoutWeaknesses.find(
      (w) => w.description.toLowerCase().includes("primary") || w.category === "visual_hierarchy",
    );
    if (weakPrimary) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("weak_primary_action"),
        category: "weak_primary_action",
        description: "Layout evaluation indicates weak primary action visibility",
        severity: "warning",
        affectedScreens: layoutEvaluation?.screenId ? [layoutEvaluation.screenId] : [],
        affectedComponents: [],
        affectedNavigationNodes: [],
        evidenceRef: layoutEvaluation?.evaluationId ?? "layout-evaluation",
        confidence: 0.65,
      });
    }

    const hiddenAction = layoutEvaluation?.layoutWeaknesses.find((w) =>
      w.description.toLowerCase().includes("hidden"),
    );
    if (hiddenAction) {
      findings.push({
        frictionId: this.metadata.buildFrictionId("hidden_important_action"),
        category: "hidden_important_action",
        description: "Layout evaluation suggests important actions may be hidden",
        severity: "warning",
        affectedScreens: layoutEvaluation?.screenId ? [layoutEvaluation.screenId] : [],
        affectedComponents: [],
        affectedNavigationNodes: [],
        evidenceRef: layoutEvaluation?.evaluationId ?? "layout-evaluation",
        confidence: 0.6,
      });
    }

    return findings;
  }
}
