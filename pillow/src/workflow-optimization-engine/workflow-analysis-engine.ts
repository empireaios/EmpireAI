/** T2-05 — Workflow analysis orchestration. */

import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { DecisionPointAnalyzer } from "./decision-point-analyzer.js";
import { FormFrictionAnalyzer } from "./form-friction-analyzer.js";
import { InteractionSequenceAnalyzer } from "./interaction-sequence-analyzer.js";
import { NavigationFrictionDetector } from "./navigation-friction-detector.js";
import { RepetitionDetector } from "./repetition-detector.js";
import { StepCountAnalyzer } from "./step-count-analyzer.js";
import { TaskPathAnalyzer } from "./task-path-analyzer.js";
import { WaitingStateAnalyzer } from "./waiting-state-analyzer.js";
import { WorkflowStrengthDetector } from "./workflow-strength-detector.js";
import { appendWorkflowOptimizationLog } from "./workflow-optimization-logging.js";
import type { FrictionCategory, WorkflowFrictionPoint, WorkflowStrength } from "./types.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";

export class WorkflowAnalysisEngine {
  private readonly stepCount = new StepCountAnalyzer();
  private readonly repetition = new RepetitionDetector();
  private readonly taskPath = new TaskPathAnalyzer();
  private readonly interactionSequence = new InteractionSequenceAnalyzer();
  private readonly navigationFriction = new NavigationFrictionDetector();
  private readonly formFriction = new FormFrictionAnalyzer();
  private readonly decisionPoint = new DecisionPointAnalyzer();
  private readonly waitingState = new WaitingStateAnalyzer();
  private readonly strengthDetector = new WorkflowStrengthDetector();

  analyze(input: {
    context: WorkflowContextModel | null;
    events: InteractionEvent[];
    navigation: NavigationGraph | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    config: WorkflowOptimizationConfiguration;
  }): { friction: WorkflowFrictionPoint[]; strengths: WorkflowStrength[] } {
    appendWorkflowOptimizationLog({
      event: "workflow_analysis",
      level: "info",
      details: `Analyzing workflow with ${input.events.length} interaction events`,
    });

    const enabled = new Set(input.config.frictionCategories);
    const allFriction: WorkflowFrictionPoint[] = [
      ...this.stepCount.analyze(input.events, input.context, input.config),
      ...this.repetition.analyze(input.events, input.config),
      ...this.taskPath.analyze(input.events, input.navigation, input.context),
      ...this.interactionSequence.analyze(input.events),
      ...this.navigationFriction.analyze(
        input.navigation,
        input.context,
        input.config.navigationFrictionEnabled,
      ),
      ...this.formFriction.analyze(input.events, input.context, input.config.formFrictionEnabled),
      ...this.decisionPoint.analyze(input.context, input.layoutEvaluation),
      ...this.waitingState.analyze(
        input.context,
        input.events,
        input.config.waitingStateRulesEnabled,
      ),
    ];

    const friction = allFriction.filter((f) => enabled.has(f.category as FrictionCategory));
    const strengths = this.strengthDetector.detect(
      input.context,
      input.events,
      input.layoutEvaluation,
    );

    return { friction, strengths };
  }
}
