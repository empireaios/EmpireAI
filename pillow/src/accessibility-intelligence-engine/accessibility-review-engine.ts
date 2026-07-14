/** T2-06 — Accessibility review orchestration. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { InteractionEvent } from "../interaction-tracking-engine/types.js";
import type { WorkflowContextModel } from "../context-awareness-engine/types.js";
import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import { ComponentAccessibilityEvaluator } from "./component-accessibility-evaluator.js";
import { LayoutAccessibilityEvaluator } from "./layout-accessibility-evaluator.js";
import { NavigationAccessibilityEvaluator } from "./navigation-accessibility-evaluator.js";
import { FormAccessibilityEvaluator } from "./form-accessibility-evaluator.js";
import { ModalAccessibilityEvaluator } from "./modal-accessibility-evaluator.js";
import { TableAccessibilityEvaluator } from "./table-accessibility-evaluator.js";
import { DashboardAccessibilityEvaluator } from "./dashboard-accessibility-evaluator.js";
import { FocusOrderAnalyzer } from "./focus-order-analyzer.js";
import { KeyboardNavigationAnalyzer } from "./keyboard-navigation-analyzer.js";
import { FeedbackStateAnalyzer } from "./feedback-state-analyzer.js";
import { appendAccessibilityLog } from "./accessibility-intelligence-logging.js";
import type {
  AccessibilityCategory,
  AccessibilityFinding,
  AccessibilityStrength,
} from "./types.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export class AccessibilityReviewEngine {
  private readonly componentEval = new ComponentAccessibilityEvaluator();
  private readonly layoutEval = new LayoutAccessibilityEvaluator();
  private readonly navigationEval = new NavigationAccessibilityEvaluator();
  private readonly formEval = new FormAccessibilityEvaluator();
  private readonly modalEval = new ModalAccessibilityEvaluator();
  private readonly tableEval = new TableAccessibilityEvaluator();
  private readonly dashboardEval = new DashboardAccessibilityEvaluator();
  private readonly focusOrder = new FocusOrderAnalyzer();
  private readonly keyboardNav = new KeyboardNavigationAnalyzer();
  private readonly feedbackState = new FeedbackStateAnalyzer();

  review(input: {
    uiState: UiStateModel | null;
    components: UiComponent[];
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    events: InteractionEvent[];
    context: WorkflowContextModel | null;
    workflowOptimization: WorkflowOptimizationRecord | null;
    config: AccessibilityIntelligenceConfiguration;
  }): { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] } {
    appendAccessibilityLog({
      event: "accessibility_review_analysis",
      level: "info",
      details: `Reviewing ${input.components.length} components`,
    });

    const enabled = new Set(input.config.reviewCategories);
    const allFindings: AccessibilityFinding[] = [];
    const allStrengths: AccessibilityStrength[] = [];

    const merge = (result: { findings: AccessibilityFinding[]; strengths: AccessibilityStrength[] }) => {
      allFindings.push(...result.findings);
      allStrengths.push(...result.strengths);
    };

    merge(this.componentEval.evaluate(input.components, input.config));
    merge(this.layoutEval.evaluate(input.layout, input.uiState, input.config));
    merge(this.navigationEval.evaluate(input.navigation, input.config));
    merge(this.formEval.evaluate(input.components, input.events, input.context, input.config));
    merge(this.modalEval.evaluate(input.components, input.layout));
    merge(this.tableEval.evaluate(input.components));
    merge(this.dashboardEval.evaluate(input.layout, input.components));
    merge(this.keyboardNav.analyze(input.events, input.navigation, input.config));

    allFindings.push(...this.focusOrder.analyze(input.events, input.components, input.config));
    allFindings.push(
      ...this.feedbackState.analyze(input.events, input.context, input.workflowOptimization),
    );

    return {
      findings: allFindings.filter((f) => enabled.has(f.findingCategory as AccessibilityCategory)),
      strengths: allStrengths,
    };
  }
}
