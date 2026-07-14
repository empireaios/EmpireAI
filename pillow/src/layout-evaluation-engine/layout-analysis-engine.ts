/** T2-04 — Layout analysis orchestration. */

import type { ComponentRecognitionResult } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import { AlignmentEvaluator } from "./alignment-evaluator.js";
import { HierarchyEvaluator } from "./hierarchy-evaluator.js";
import { InformationOrganizationEvaluator } from "./information-organization-evaluator.js";
import { NavigationLayoutEvaluator } from "./navigation-layout-evaluator.js";
import { SpacingEvaluator } from "./spacing-evaluator.js";
import { StructureEvaluator } from "./structure-evaluator.js";
import { VisualBalanceEvaluator } from "./visual-balance-evaluator.js";
import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";
import type { EvaluationCategory, LayoutFinding } from "./types.js";
import type { LayoutEvaluationConfiguration } from "./configuration.js";

export class LayoutAnalysisEngine {
  private readonly structure = new StructureEvaluator();
  private readonly alignment = new AlignmentEvaluator();
  private readonly spacing = new SpacingEvaluator();
  private readonly hierarchy = new HierarchyEvaluator();
  private readonly visualBalance = new VisualBalanceEvaluator();
  private readonly navigation = new NavigationLayoutEvaluator();
  private readonly information = new InformationOrganizationEvaluator();

  analyze(input: {
    layout: LayoutModel | null;
    recognition: ComponentRecognitionResult | null;
    navigation: NavigationGraph | null;
    config: LayoutEvaluationConfiguration;
  }): LayoutFinding[] {
    appendLayoutEvaluationLog({
      event: "layout_analysis",
      level: "info",
      details: "Analyzing layout structure and organization",
    });

    const enabled = new Set(input.config.evaluationCategories);
    const all: LayoutFinding[] = [
      ...this.structure.evaluate(input.layout),
      ...this.alignment.evaluate(input.layout),
      ...this.spacing.evaluate(input.layout),
      ...this.hierarchy.evaluate(input.layout),
      ...this.visualBalance.evaluate(input.layout),
      ...this.navigation.evaluate(input.layout, input.navigation),
      ...this.information.evaluate(input.layout, input.recognition),
    ];

    return all.filter((f) => enabled.has(f.category as EvaluationCategory));
  }
}
