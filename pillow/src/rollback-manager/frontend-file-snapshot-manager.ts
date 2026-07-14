/** T3-08 — Frontend file snapshot management. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { appendRollbackLog } from "./rollback-logging.js";

export type FileSnapshot = {
  snapshotId: string;
  timestamp: string;
  files: { path: string; content: string }[];
};

export class FrontendFileSnapshotManager {
  private readonly snapshots = new Map<string, FileSnapshot>();
  private readonly metadata = new RollbackMetadataGenerator();

  createSnapshot(
    frontendBuild: FrontendBuildReport | null,
    config: RollbackManagerConfiguration,
  ): FileSnapshot {
    appendRollbackLog({
      event: "restore_point_creation",
      level: "info",
      details: "Creating frontend file snapshot",
    });

    const files: { path: string; content: string }[] = [];
    for (const record of frontendBuild?.records ?? []) {
      for (const change of record.proposedCodeChanges) {
        if (config.protectedFiles.some((p) => change.targetFile.endsWith(p))) continue;
        files.push({
          path: change.targetFile,
          content: change.suggestedSnippet,
        });
      }
      for (const target of record.targetFiles) {
        if (config.protectedFiles.some((p) => target.endsWith(p))) continue;
        if (!files.some((f) => f.path === target)) {
          files.push({ path: target, content: `// snapshot: ${target}` });
        }
      }
    }

    const snapshot: FileSnapshot = {
      snapshotId: this.metadata.buildSnapshotId(),
      timestamp: new Date().toISOString(),
      files,
    };
    this.snapshots.set(snapshot.snapshotId, snapshot);
    this.cleanup(config);
    return snapshot;
  }

  restore(snapshotId: string, config: RollbackManagerConfiguration): string[] {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return [];
    return snapshot.files
      .filter((f) => !config.protectedFiles.some((p) => f.path.endsWith(p)))
      .map((f) => f.path);
  }

  cleanup(config: RollbackManagerConfiguration): void {
    if (!config.cleanupExpiredSnapshots) return;
    const cutoff = Date.now() - config.snapshotRetentionMs;
    for (const [id, snap] of this.snapshots) {
      if (new Date(snap.timestamp).getTime() < cutoff) {
        this.snapshots.delete(id);
      }
    }
  }

  resetForTesting(): void {
    this.snapshots.clear();
  }
}
