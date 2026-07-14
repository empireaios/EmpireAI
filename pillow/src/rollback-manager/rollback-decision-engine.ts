/** T3-08 — Rollback trigger detection and decision. */

import type { RegressionRunReport } from "../regression-protection/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RollbackTrigger } from "./types.js";
import { appendRollbackLog } from "./rollback-logging.js";

export type RollbackDecisionInput = {
  regressionReport: RegressionRunReport | null;
  validationReport: ValidationRunReport | null;
  previewGeneration: PreviewGenerationReport | null;
  componentGeneration: ComponentGenerationReport | null;
  layoutRefactoring: LayoutRefactoringReport | null;
  themeGeneration: ThemeGenerationReport | null;
  config: RollbackManagerConfiguration;
  manualTrigger?: RollbackTrigger;
};

export class RollbackDecisionEngine {
  detectTrigger(input: RollbackDecisionInput): RollbackTrigger | null {
    appendRollbackLog({
      event: "rollback_trigger_detection",
      level: "info",
      details: "Detecting rollback trigger",
    });

    if (input.manualTrigger && input.config.rollbackTriggerRules.includes(input.manualTrigger)) {
      return input.manualTrigger;
    }

    if (
      input.regressionReport?.validation.decision === "blocked" ||
      input.regressionReport?.validation.decision === "fail"
    ) {
      if (input.config.rollbackTriggerRules.includes("regression_failure")) {
        return "regression_failure";
      }
    }

    if (
      input.validationReport?.validation.decision === "blocked" ||
      input.validationReport?.validation.decision === "fail"
    ) {
      if (input.config.rollbackTriggerRules.includes("validation_failure")) {
        return "validation_failure";
      }
      if (input.config.rollbackTriggerRules.includes("unsafe_ui_defect")) {
        return "unsafe_ui_defect";
      }
    }

    const blockedPreview = input.previewGeneration?.records.find(
      (r) => r.buildStatus === "blocked" || r.buildStatus === "failed",
    );
    if (blockedPreview && input.config.rollbackTriggerRules.includes("rejected_preview")) {
      return "rejected_preview";
    }

    const brokenComponent = input.componentGeneration?.records.find(
      (r) => r.generationStatus === "blocked" || r.generationStatus === "failed",
    );
    if (brokenComponent && input.config.rollbackTriggerRules.includes("broken_component")) {
      return "broken_component";
    }

    const brokenLayout = input.layoutRefactoring?.records.find(
      (r) => r.refactoringStatus === "blocked" || r.refactoringStatus === "failed",
    );
    if (brokenLayout && input.config.rollbackTriggerRules.includes("broken_layout")) {
      return "broken_layout";
    }

    const brokenTheme = input.themeGeneration?.records.find(
      (r) => r.themeStatus === "blocked" || r.themeStatus === "failed",
    );
    if (brokenTheme && input.config.rollbackTriggerRules.includes("broken_theme")) {
      return "broken_theme";
    }

    return null;
  }

  shouldRollback(trigger: RollbackTrigger | null): boolean {
    return trigger !== null;
  }
}
