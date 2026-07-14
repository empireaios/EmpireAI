/** T1-09 — Persisted session context store. */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { appendContinuityLog } from "./continuity-logging.js";
import type { SessionContinuityConfiguration } from "./configuration.js";
import type { PersistedSessionSnapshot, SessionContinuityModel } from "./types.js";

export class SessionContextStore {
  private memorySnapshot: PersistedSessionSnapshot | null = null;

  constructor(
    private repositoryRoot: string,
    private config: SessionContinuityConfiguration,
  ) {}

  getSnapshotPath(): string {
    return join(this.repositoryRoot, this.config.persistenceRoot, "session-snapshot.json");
  }

  initialize(): PersistedSessionSnapshot | null {
    if (!this.config.persistSessionContext) return null;
    const path = this.getSnapshotPath();
    const dir = join(this.repositoryRoot, this.config.persistenceRoot);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(path)) return null;
    try {
      const snapshot = JSON.parse(readFileSync(path, "utf8")) as PersistedSessionSnapshot;
      this.memorySnapshot = snapshot;
      return snapshot;
    } catch {
      appendContinuityLog({
        event: "storage_failure",
        level: "warn",
        details: "Failed to load session snapshot — starting fresh",
      });
      return null;
    }
  }

  save(model: SessionContinuityModel, actorIdentifier: string | null): void {
    const snapshot: PersistedSessionSnapshot = {
      sessionId: model.sessionId,
      actorIdentifier,
      lastContinuity: model,
      lastPersistedAt: new Date().toISOString(),
      restartDetected: false,
    };
    this.memorySnapshot = snapshot;
    if (!this.config.persistSessionContext) return;
    try {
      const dir = join(this.repositoryRoot, this.config.persistenceRoot);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.getSnapshotPath(), JSON.stringify(snapshot, null, 2), "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Snapshot save failed";
      appendContinuityLog({ event: "storage_failure", level: "error", details: message });
    }
  }

  getSnapshot(): PersistedSessionSnapshot | null {
    return this.memorySnapshot ? structuredClone(this.memorySnapshot) : null;
  }

  markRestartDetected(): void {
    if (this.memorySnapshot) {
      this.memorySnapshot.restartDetected = true;
    }
  }

  resetForTesting(): void {
    this.memorySnapshot = null;
  }
}
