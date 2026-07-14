/** T3-05 — Collects preview sources from T3 upstream engines. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import { appendPreviewLog } from "./preview-logging.js";

export type PreviewSourceBundle = {
  frontendBuildIds: string[];
  componentGenerationIds: string[];
  layoutRefactoringIds: string[];
  themeIds: string[];
  previewFiles: string[];
  screenId: string;
  routeOrViewId: string | null;
  confidenceScore: number;
};

export class PreviewSourceCollector {
  collect(input: {
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
  }): PreviewSourceBundle[] {
    appendPreviewLog({
      event: "preview_source_collection",
      level: "info",
      details: "Collecting preview sources from T3 upstream",
    });

    const bundles: PreviewSourceBundle[] = [];

    const fbRecords = input.frontendBuild?.records ?? [];
    const cgRecords = input.componentGeneration?.records ?? [];
    const lrRecords = input.layoutRefactoring?.records ?? [];
    const tbRecords = input.themeGeneration?.records ?? [];

    if (fbRecords.length > 0) {
      for (const fb of fbRecords.slice(0, 5)) {
        bundles.push({
          frontendBuildIds: [fb.buildRecordId],
          componentGenerationIds: cgRecords
            .filter((c) => c.sourceFrontendBuildRecordId === fb.buildRecordId)
            .map((c) => c.componentGenerationId),
          layoutRefactoringIds: lrRecords
            .filter((l) => l.sourceFrontendBuildRecordId === fb.buildRecordId)
            .map((l) => l.layoutRefactoringId),
          themeIds: tbRecords
            .filter((t) => t.sourceFrontendBuildRecordId === fb.buildRecordId)
            .map((t) => t.themeId),
          previewFiles: [
            ...fb.targetFiles,
            ...cgRecords.flatMap((c) => c.targetFiles),
            ...lrRecords.flatMap((l) => l.targetFiles),
            ...tbRecords.flatMap((t) => t.targetFiles),
          ],
          screenId: fb.sourceRecommendationId,
          routeOrViewId: null,
          confidenceScore: fb.confidenceScore,
        });
      }
    }

    if (bundles.length === 0 && cgRecords.length > 0) {
      for (const cg of cgRecords.slice(0, 5)) {
        bundles.push({
          frontendBuildIds: [],
          componentGenerationIds: [cg.componentGenerationId],
          layoutRefactoringIds: [],
          themeIds: [],
          previewFiles: cg.targetFiles,
          screenId: cg.componentName,
          routeOrViewId: null,
          confidenceScore: cg.confidenceScore,
        });
      }
    }

    if (bundles.length === 0 && lrRecords.length > 0) {
      for (const lr of lrRecords.slice(0, 5)) {
        bundles.push({
          frontendBuildIds: [],
          componentGenerationIds: lr.sourceComponentGenerationIds,
          layoutRefactoringIds: [lr.layoutRefactoringId],
          themeIds: [],
          previewFiles: lr.targetFiles,
          screenId: lr.targetScreenId,
          routeOrViewId: lr.targetRouteOrViewId,
          confidenceScore: lr.confidenceScore,
        });
      }
    }

    if (bundles.length === 0 && tbRecords.length > 0) {
      for (const tb of tbRecords.slice(0, 5)) {
        bundles.push({
          frontendBuildIds: [],
          componentGenerationIds: tb.sourceComponentGenerationIds,
          layoutRefactoringIds: tb.sourceLayoutRefactoringId
            ? [tb.sourceLayoutRefactoringId]
            : [],
          themeIds: [tb.themeId],
          previewFiles: tb.targetFiles,
          screenId: tb.themeName,
          routeOrViewId: null,
          confidenceScore: tb.confidenceScore,
        });
      }
    }

    if (bundles.length === 0) {
      bundles.push({
        frontendBuildIds: [],
        componentGenerationIds: [],
        layoutRefactoringIds: [],
        themeIds: [],
        previewFiles: ["empireai-web/.preview/default-preview.json"],
        screenId: "default-preview",
        routeOrViewId: "/preview/default",
        confidenceScore: 50,
      });
    }

    return bundles;
  }
}
