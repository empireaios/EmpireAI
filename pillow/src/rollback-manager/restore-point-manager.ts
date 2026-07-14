/** T3-08 — Restore point creation and management. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { RegressionRunReport } from "../regression-protection/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RestorePoint } from "./types.js";
import { FrontendFileSnapshotManager } from "./frontend-file-snapshot-manager.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { appendRollbackLog } from "./rollback-logging.js";
import { ROLLBACK_METADATA_VERSION } from "./paths.js";

export class RestorePointManager {
  private readonly restorePoints: RestorePoint[] = [];
  private readonly snapshotManager = new FrontendFileSnapshotManager();
  private readonly metadata = new RollbackMetadataGenerator();

  createRestorePoint(input: {
    config: RollbackManagerConfiguration;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    previewGeneration: PreviewGenerationReport | null;
    regressionReport: RegressionRunReport | null;
  }): RestorePoint {
    if (!input.config.restorePointRulesEnabled) {
      throw new Error("Restore point creation disabled by configuration");
    }

    appendRollbackLog({
      event: "restore_point_creation",
      level: "info",
      details: "Creating safe restore point",
    });

    const snapshot = this.snapshotManager.createSnapshot(input.frontendBuild, input.config);
    const preview = input.previewGeneration?.records[0];
    const frontendRecord = input.frontendBuild?.records[0];

    const point = this.metadata.enrichRestorePoint({
      restorePointId: this.metadata.buildRestorePointId(),
      timestamp: new Date().toISOString(),
      sourceUiStateId: input.regressionReport?.reports[0]?.baselineUiStateId ?? null,
      sourceFrontendBuildId: frontendRecord?.buildRecordId ?? null,
      sourceComponentGenerationIds:
        input.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
      sourceLayoutRefactoringIds:
        input.layoutRefactoring?.records.map((r) => r.layoutRefactoringId) ?? [],
      sourceThemeIds: input.themeGeneration?.records.map((r) => r.themeId) ?? [],
      fileSnapshotReferences: [snapshot.snapshotId],
      componentVersionReferences:
        input.componentGeneration?.records.map((r) => r.componentGenerationId) ?? [],
      layoutVersionReferences:
        input.layoutRefactoring?.records.map((r) => r.layoutRefactoringId) ?? [],
      themeVersionReferences: input.themeGeneration?.records.map((r) => r.themeId) ?? [],
      restorePointStatus: "active",
      metadataVersion: ROLLBACK_METADATA_VERSION,
    });

    void preview;
    this.restorePoints.push(point);
    while (this.restorePoints.length > input.config.maxRestorePoints) {
      const expired = this.restorePoints.shift();
      if (expired) expired.restorePointStatus = "expired";
    }

    return point;
  }

  getRestorePoints(): RestorePoint[] {
    return [...this.restorePoints];
  }

  getActiveRestorePoints(): RestorePoint[] {
    return this.restorePoints.filter((p) => p.restorePointStatus === "active");
  }

  getSnapshotManager(): FrontendFileSnapshotManager {
    return this.snapshotManager;
  }

  resetForTesting(): void {
    this.restorePoints.length = 0;
    this.snapshotManager.resetForTesting();
  }
}
