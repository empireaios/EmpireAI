/** T3-09 — Collects upstream change sources from T3-01 through T3-08. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { RegressionRunReport } from "../regression-protection/types.js";
import type { RollbackRunReport } from "../rollback-manager/types.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";

export type CollectedChangeSources = {
  frontendBuild: FrontendBuildReport | null;
  componentGeneration: ComponentGenerationReport | null;
  layoutRefactoring: LayoutRefactoringReport | null;
  themeGeneration: ThemeGenerationReport | null;
  previewGeneration: PreviewGenerationReport | null;
  validationReport: ValidationRunReport | null;
  regressionReport: RegressionRunReport | null;
  rollbackReport: RollbackRunReport | null;
};

export class ChangeSourceCollector {
  collect(input: CollectedChangeSources): CollectedChangeSources {
    appendChangeDocumentationLog({
      event: "source_collection",
      level: "info",
      details: "Collecting change documentation sources",
    });
    return { ...input };
  }
}
