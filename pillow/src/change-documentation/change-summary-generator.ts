/** T3-09 — Change summary generation. */

import type { CollectedChangeSources } from "./change-source-collector.js";
import type { ChangeType } from "./types.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";

export class ChangeSummaryGenerator {
  generate(changeType: ChangeType, sources: CollectedChangeSources): string {
    appendChangeDocumentationLog({
      event: "change_summary_generation",
      level: "info",
      details: `Generating summary for ${changeType}`,
    });

    const counts = {
      frontend: sources.frontendBuild?.records.length ?? 0,
      components: sources.componentGeneration?.records.length ?? 0,
      layouts: sources.layoutRefactoring?.records.length ?? 0,
      themes: sources.themeGeneration?.records.length ?? 0,
      previews: sources.previewGeneration?.records.length ?? 0,
    };

    switch (changeType) {
      case "frontend_code_generation":
        return `Generated frontend code for ${counts.frontend} build record(s)`;
      case "component_generation":
      case "component_variant_generation":
        return `Generated ${counts.components} component(s)`;
      case "layout_refactoring":
        return `Refactored ${counts.layouts} layout(s)`;
      case "theme_generation":
        return `Generated ${counts.themes} theme(s)`;
      case "preview_build_creation":
        return `Created ${counts.previews} preview build(s)`;
      case "validation_pass":
        return `Validation passed with ${sources.validationReport?.validation.defectsDetected ?? 0} defects`;
      case "validation_failure":
        return `Validation failed: ${sources.validationReport?.validation.decision ?? "unknown"}`;
      case "regression_pass":
        return `Regression check passed`;
      case "regression_failure":
        return `Regression detected: ${sources.regressionReport?.validation.regressionsDetected ?? 0} issue(s)`;
      case "rollback_execution":
        return `Rollback executed: ${sources.rollbackReport?.reports.length ?? 0} action(s)`;
      case "rollback_verification":
        return `Rollback verification completed`;
      case "accepted_change":
        return "Change accepted after validation and regression checks";
      case "rejected_change":
        return "Change rejected due to validation or regression failure";
      case "failed_change":
        return "Change failed during build or preview";
      default:
        return `Documented ${changeType} change`;
    }
  }
}
