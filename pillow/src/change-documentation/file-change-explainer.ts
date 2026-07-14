/** T3-09 — File change explanation. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";

export class FileChangeExplainer {
  explain(input: {
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    config: ChangeDocumentationConfiguration;
  }): { affectedFiles: string[]; explanation: string } {
    if (!input.config.fileChangeSummaryRulesEnabled) {
      return { affectedFiles: [], explanation: "File change summary disabled" };
    }

    appendChangeDocumentationLog({
      event: "file_change_documentation",
      level: "info",
      details: "Explaining affected files",
    });

    const files = new Set<string>();
    for (const record of input.frontendBuild?.records ?? []) {
      for (const f of record.targetFiles) files.add(f);
      for (const c of record.proposedCodeChanges) files.add(c.targetFile);
    }
    for (const record of input.componentGeneration?.records ?? []) {
      if (record.generatedComponentCode) files.add(`components/${record.componentName}.tsx`);
    }
    for (const record of input.layoutRefactoring?.records ?? []) {
      for (const f of record.targetFiles) files.add(f);
    }
    for (const record of input.themeGeneration?.records ?? []) {
      if (record.generatedThemeCode) files.add(`themes/${record.themeName}.css`);
    }

    const affectedFiles = [...files];
    const explanation =
      affectedFiles.length > 0
        ? `${affectedFiles.length} file(s) affected: ${affectedFiles.slice(0, 5).join(", ")}${affectedFiles.length > 5 ? "…" : ""}`
        : "No file changes identified";

    return { affectedFiles, explanation };
  }
}
