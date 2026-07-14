/** T2-05 — Workflow strength detection. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { WorkflowMetadataGenerator } from "./workflow-metadata-generator.js";
import type { WorkflowStrength } from "./types.js";

export class WorkflowStrengthDetector {
  private readonly metadata = new WorkflowMetadataGenerator();

  detect(
    context: WorkflowContextModel | null,
    events: InteractionEvent[],
    layoutEvaluation: LayoutEvaluationModel | null,
  ): WorkflowStrength[] {
    const strengths: WorkflowStrength[] = [];

    if (context?.currentWorkflowName && context.currentUserTask) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        description: `Clear workflow '${context.currentWorkflowName}' with defined task`,
        category: "workflow_clarity",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        evidenceRef: context.contextId,
        confidence: context.confidence,
      });
    }

    if (events.length > 0 && events.length <= 4) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        description: `Efficient interaction path with only ${events.length} steps`,
        category: "efficient_path",
        affectedScreens: [
          ...new Set(events.map((e) => e.currentScreenId).filter(Boolean)),
        ] as string[],
        evidenceRef: "interaction-sequence",
        confidence: 0.75,
      });
    }

    const layoutStrengths = layoutEvaluation?.layoutStrengths ?? [];
    if (layoutStrengths.length >= 2) {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        description: `${layoutStrengths.length} layout strengths support current workflow`,
        category: "layout_support",
        affectedScreens: layoutEvaluation?.screenId ? [layoutEvaluation.screenId] : [],
        evidenceRef: layoutEvaluation?.evaluationId ?? "layout-evaluation",
        confidence: (layoutEvaluation?.confidenceScore ?? 50) / 100,
      });
    }

    if (context && !context.waitingOrLoading && context.contextState !== "waiting" && context.contextState !== "loading") {
      strengths.push({
        strengthId: this.metadata.buildStrengthId(),
        description: "Workflow proceeds without loading or waiting friction",
        category: "responsive_flow",
        affectedScreens: context.currentScreenId ? [context.currentScreenId] : [],
        evidenceRef: context.contextId,
        confidence: 0.7,
      });
    }

    return strengths;
  }
}
