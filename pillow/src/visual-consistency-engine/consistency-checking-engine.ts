/** T2-07 — Consistency checking orchestration. */

import type { UiStateModel } from "../ui-state-mapper/types.js";
import type { UiComponent } from "../component-recognition-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import { ComponentConsistencyChecker } from "./component-consistency-checker.js";
import { TypographyConsistencyChecker } from "./typography-consistency-checker.js";
import { ColorConsistencyChecker } from "./color-consistency-checker.js";
import { SpacingConsistencyChecker } from "./spacing-consistency-checker.js";
import { SizingConsistencyChecker } from "./sizing-consistency-checker.js";
import { IconConsistencyChecker } from "./icon-consistency-checker.js";
import { LayoutConsistencyChecker } from "./layout-consistency-checker.js";
import { NavigationConsistencyChecker } from "./navigation-consistency-checker.js";
import { FormConsistencyChecker } from "./form-consistency-checker.js";
import { PatternConsistencyChecker } from "./pattern-consistency-checker.js";
import { appendConsistencyLog } from "./visual-consistency-logging.js";
import type { ConsistencyCategory, ConsistencyFinding, ConsistencyStrength } from "./types.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export class ConsistencyCheckingEngine {
  private readonly componentChecker = new ComponentConsistencyChecker();
  private readonly typographyChecker = new TypographyConsistencyChecker();
  private readonly colorChecker = new ColorConsistencyChecker();
  private readonly spacingChecker = new SpacingConsistencyChecker();
  private readonly sizingChecker = new SizingConsistencyChecker();
  private readonly iconChecker = new IconConsistencyChecker();
  private readonly layoutChecker = new LayoutConsistencyChecker();
  private readonly navigationChecker = new NavigationConsistencyChecker();
  private readonly formChecker = new FormConsistencyChecker();
  private readonly patternChecker = new PatternConsistencyChecker();

  review(input: {
    uiState: UiStateModel | null;
    components: UiComponent[];
    layout: LayoutModel | null;
    navigation: NavigationGraph | null;
    designSystem: DesignSystemModel | null;
    executiveStyle: ExecutiveStyleModel | null;
    layoutEvaluation: LayoutEvaluationModel | null;
    accessibilityReview: AccessibilityReviewRecord | null;
    config: VisualConsistencyConfiguration;
  }): { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] } {
    appendConsistencyLog({
      event: "consistency_review_analysis",
      level: "info",
      details: `Checking consistency for ${input.components.length} components`,
    });

    const enabled = new Set(input.config.reviewCategories);
    const allFindings: ConsistencyFinding[] = [];
    const allStrengths: ConsistencyStrength[] = [];

    const merge = (result: { findings: ConsistencyFinding[]; strengths: ConsistencyStrength[] }) => {
      allFindings.push(...result.findings);
      allStrengths.push(...result.strengths);
    };

    merge(this.componentChecker.check(input.components, input.designSystem, input.config));
    appendConsistencyLog({ event: "component_consistency_evaluation", level: "info", details: "Component check complete" });

    merge(
      this.typographyChecker.check(
        input.designSystem,
        input.layoutEvaluation,
        input.executiveStyle,
        input.config,
      ),
    );
    appendConsistencyLog({ event: "typography_consistency_evaluation", level: "info", details: "Typography check complete" });

    merge(
      this.colorChecker.check(input.designSystem, input.layoutEvaluation, input.executiveStyle, input.config),
    );
    appendConsistencyLog({ event: "color_consistency_evaluation", level: "info", details: "Color check complete" });

    merge(
      this.spacingChecker.check(input.layout, input.designSystem, input.layoutEvaluation, input.config),
    );
    appendConsistencyLog({ event: "spacing_consistency_evaluation", level: "info", details: "Spacing check complete" });

    merge(this.sizingChecker.check(input.components, input.designSystem, input.config));
    merge(this.iconChecker.check(input.components, input.designSystem, input.config));
    merge(
      this.layoutChecker.check(input.layout, input.designSystem, input.layoutEvaluation, input.config),
    );
    merge(
      this.navigationChecker.check(input.navigation, input.designSystem, input.executiveStyle, input.config),
    );
    merge(this.formChecker.check(input.components, input.config));
    merge(
      this.patternChecker.check(
        input.components,
        input.layout,
        input.layoutEvaluation,
        input.executiveStyle,
        input.accessibilityReview,
        input.config,
      ),
    );
    appendConsistencyLog({ event: "pattern_consistency_evaluation", level: "info", details: "Pattern check complete" });

    return {
      findings: allFindings.filter(
        (f) =>
          enabled.has(f.findingCategory as ConsistencyCategory) &&
          f.detectionConfidence >= input.config.confidenceThreshold,
      ),
      strengths: allStrengths,
    };
  }
}
