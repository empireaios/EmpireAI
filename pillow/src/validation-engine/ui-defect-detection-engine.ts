/** T3-06 — UI defect detection aggregator. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ComponentValidationEngine } from "./component-validation-engine.js";
import { LayoutValidationEngine } from "./layout-validation-engine.js";
import { ThemeValidationEngine } from "./theme-validation-engine.js";
import { ResponsiveValidationEngine } from "./responsive-validation-engine.js";
import { StateValidationEngine } from "./state-validation-engine.js";
import { appendValidationLog } from "./validation-logging.js";

export class UiDefectDetectionEngine {
  private readonly componentValidator = new ComponentValidationEngine();
  private readonly layoutValidator = new LayoutValidationEngine();
  private readonly themeValidator = new ThemeValidationEngine();
  private readonly responsiveValidator = new ResponsiveValidationEngine();
  private readonly stateValidator = new StateValidationEngine();

  detect(input: {
    target: PreviewValidationTarget;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    config: ValidationEngineConfiguration;
  }): UiDefect[] {
    appendValidationLog({
      event: "defect_detection",
      level: "info",
      details: `Detecting defects for ${input.target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];

    if (input.config.previewValidationRulesEnabled) {
      defects.push(...this.stateValidator.validate(input.target, input.config));
    }
    defects.push(
      ...this.componentValidator.validate(
        input.target,
        input.componentGeneration,
        input.config,
      ),
    );
    defects.push(
      ...this.layoutValidator.validate(input.target, input.layoutRefactoring, input.config),
    );
    defects.push(
      ...this.themeValidator.validate(input.target, input.themeGeneration, input.config),
    );
    defects.push(...this.responsiveValidator.validate(input.target, input.config));

    if (input.config.severityRulesEnabled) {
      return defects.filter((d) => d.detectionConfidence / 100 >= input.config.minConfidenceThreshold);
    }

    return defects;
  }
}
