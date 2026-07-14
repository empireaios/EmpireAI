/** T3-08 — Rollback execution engine. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RestorePoint } from "./types.js";
import { ComponentVersionRestorer } from "./component-version-restorer.js";
import { LayoutVersionRestorer } from "./layout-version-restorer.js";
import { ThemeVersionRestorer } from "./theme-version-restorer.js";
import { RestorePointManager } from "./restore-point-manager.js";
import { appendRollbackLog } from "./rollback-logging.js";

export type RollbackExecutionResult = {
  revertedFiles: string[];
  revertedComponents: string[];
  revertedLayouts: string[];
  revertedThemes: string[];
  errors: string[];
  warnings: string[];
};

export class RollbackExecutionEngine {
  private readonly componentRestorer = new ComponentVersionRestorer();
  private readonly layoutRestorer = new LayoutVersionRestorer();
  private readonly themeRestorer = new ThemeVersionRestorer();

  execute(input: {
    restorePoint: RestorePoint;
    restorePointManager: RestorePointManager;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    config: RollbackManagerConfiguration;
  }): RollbackExecutionResult {
    appendRollbackLog({
      event: "rollback_execution",
      level: "info",
      details: `Executing rollback to ${input.restorePoint.restorePointId}`,
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    const snapshotId = input.restorePoint.fileSnapshotReferences[0];
    const revertedFiles = snapshotId
      ? input.restorePointManager.getSnapshotManager().restore(snapshotId, input.config)
      : [];

    if (revertedFiles.length === 0) {
      warnings.push("No frontend files restored from snapshot");
    }

    const revertedComponents = this.componentRestorer.restore(
      input.restorePoint,
      input.componentGeneration,
      input.config,
    );
    const revertedLayouts = this.layoutRestorer.restore(
      input.restorePoint,
      input.layoutRefactoring,
      input.config,
    );
    const revertedThemes = this.themeRestorer.restore(
      input.restorePoint,
      input.themeGeneration,
      input.config,
    );

    if (revertedComponents.length === 0 && input.restorePoint.componentVersionReferences.length > 0) {
      warnings.push("Component version restore partial");
    }

    return { revertedFiles, revertedComponents, revertedLayouts, revertedThemes, errors, warnings };
  }
}
