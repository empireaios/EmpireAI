/** T3-06 — Preview validation runner — collects preview + upstream sources. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { PreviewBuildRecord } from "../preview-generator/types.js";
import { appendValidationLog } from "./validation-logging.js";

export type PreviewValidationTarget = {
  preview: PreviewBuildRecord;
  frontendBuildIds: string[];
  componentGenerationIds: string[];
  layoutRefactoringIds: string[];
  themeIds: string[];
};

export class PreviewValidationRunner {
  collectTargets(input: {
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
  }): PreviewValidationTarget[] {
    appendValidationLog({
      event: "preview_validation",
      level: "info",
      details: "Collecting preview validation targets",
    });

    const previews = input.previewGeneration?.records ?? [];
    if (previews.length > 0) {
      return previews.map((preview) => ({
        preview,
        frontendBuildIds: preview.sourceFrontendBuildRecordIds,
        componentGenerationIds: preview.sourceComponentGenerationIds,
        layoutRefactoringIds: preview.sourceLayoutRefactoringIds,
        themeIds: preview.sourceThemeIds,
      }));
    }

    return [
      {
        preview: {
          previewBuildId: "pg-default-preview",
          timestamp: new Date().toISOString(),
          sourceFrontendBuildRecordIds: input.frontendBuild?.records.map((r) => r.buildRecordId) ?? [],
          sourceComponentGenerationIds:
            input.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
          sourceLayoutRefactoringIds:
            input.layoutRefactoring?.records.map((r) => r.layoutRefactoringId) ?? [],
          sourceThemeIds: input.themeGeneration?.records.map((r) => r.themeId) ?? [],
          previewScope: "page",
          previewTargetScreenId: "default-screen",
          previewTargetRouteOrViewId: "/preview/default",
          previewFiles: ["empireai-web/.preview/default-preview.json"],
          previewUrl: "/preview/default",
          previewLocalReference: "empireai-web/.preview/default/index.html",
          previewEnvironmentStatus: "ready",
          buildStatus: "built",
          safetyChecks: [],
          confidenceScore: 50,
          metadataVersion: "1.0.0",
        },
        frontendBuildIds: input.frontendBuild?.records.map((r) => r.buildRecordId) ?? [],
        componentGenerationIds:
          input.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
        layoutRefactoringIds:
          input.layoutRefactoring?.records.map((r) => r.layoutRefactoringId) ?? [],
        themeIds: input.themeGeneration?.records.map((r) => r.themeId) ?? [],
      },
    ];
  }
}
