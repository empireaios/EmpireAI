/** T1-07 — Multi-step workflow step detection. */

import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";

export type WorkflowStep = {
  stepIndex: number;
  stepLabel: string | null;
  confidence: number;
};

export class WorkflowStepDetector {
  detect(
    graph: NavigationGraph | null,
    recentEvents: InteractionEvent[],
  ): WorkflowStep {
    const tabSwitches = recentEvents.filter((e) => e.interactionType === "tab_switch").length;
    const navTransitions = graph?.edges.filter((e) => e.transitionType === "navigation").length ?? 0;
    const stepIndex = Math.max(0, tabSwitches + Math.min(navTransitions, 3));

    const stepNode = graph?.nodes.find((n) => n.kind === "tab" && n.active);
    return {
      stepIndex,
      stepLabel: stepNode?.label ?? (stepIndex > 0 ? `step_${stepIndex}` : null),
      confidence: stepNode ? 0.85 : 0.65,
    };
  }
}
