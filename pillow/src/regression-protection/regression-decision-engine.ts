/** T3-07 — Regression decision engine — aggregates all detectors. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { UxScoreRegressionDetector } from "./ux-score-regression-detector.js";
import { LayoutRegressionDetector } from "./layout-regression-detector.js";
import { ComponentRegressionDetector } from "./component-regression-detector.js";
import { NavigationRegressionDetector } from "./navigation-regression-detector.js";
import { AccessibilityRegressionDetector } from "./accessibility-regression-detector.js";
import { ConsistencyRegressionDetector } from "./consistency-regression-detector.js";
import { WorkflowRegressionDetector } from "./workflow-regression-detector.js";
import { ResponsiveRegressionDetector } from "./responsive-regression-detector.js";
import { StateRegressionDetector } from "./state-regression-detector.js";
import { appendRegressionLog } from "./regression-logging.js";

export class RegressionDecisionEngine {
  private readonly uxScoreDetector = new UxScoreRegressionDetector();
  private readonly layoutDetector = new LayoutRegressionDetector();
  private readonly componentDetector = new ComponentRegressionDetector();
  private readonly navigationDetector = new NavigationRegressionDetector();
  private readonly accessibilityDetector = new AccessibilityRegressionDetector();
  private readonly consistencyDetector = new ConsistencyRegressionDetector();
  private readonly workflowDetector = new WorkflowRegressionDetector();
  private readonly responsiveDetector = new ResponsiveRegressionDetector();
  private readonly stateDetector = new StateRegressionDetector();

  detect(input: {
    baseline: BaselineUiState;
    proposed: ProposedUiState;
    validationReport: ValidationRunReport | null;
    previewGeneration: PreviewGenerationReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutModel: LayoutModel | null;
    navigationGraph: NavigationGraph | null;
    config: RegressionProtectionConfiguration;
  }): UiRegression[] {
    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: `Detecting regressions for ${input.proposed.proposedUiStateId}`,
    });

    const regressions: UiRegression[] = [
      ...this.uxScoreDetector.detect(input.baseline, input.proposed, input.config),
      ...this.layoutDetector.detect(
        input.baseline,
        input.proposed,
        input.layoutModel,
        input.config,
      ),
      ...this.componentDetector.detect(
        input.baseline,
        input.proposed,
        input.componentGeneration,
        input.config,
      ),
      ...this.navigationDetector.detect(
        input.baseline,
        input.proposed,
        input.navigationGraph,
        input.config,
      ),
      ...this.accessibilityDetector.detect(input.baseline, input.proposed, input.config),
      ...this.consistencyDetector.detect(input.baseline, input.proposed, input.config),
      ...this.workflowDetector.detect(input.baseline, input.proposed, input.config),
      ...this.responsiveDetector.detect(
        input.baseline,
        input.proposed,
        input.previewGeneration,
        input.config,
      ),
      ...this.stateDetector.detect(
        input.baseline,
        input.proposed,
        input.validationReport,
        input.previewGeneration,
        input.config,
      ),
    ];

    if (input.config.severityRulesEnabled) {
      return regressions.filter(
        (r) => r.detectionConfidence / 100 >= input.config.minConfidenceThreshold,
      );
    }

    return regressions;
  }
}
