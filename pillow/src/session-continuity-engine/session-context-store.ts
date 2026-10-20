/** T1-09 — Persisted session context store. */

import fs, { mkdirSync, existsSync } from "node:fs";
import {randomUUID} from "node:crypto";
import {acquireSessionContinuityLock,readSessionSnapshotFile,withSessionContinuitySnapshot,type SessionContinuityRecoverySnapshot} from "./recovery-snapshot.js";
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
    try {
      const release=acquireSessionContinuityLock(dir);
      let stored;try{if (!existsSync(dir)) mkdirSync(dir);stored=readSessionSnapshotFile(path);}finally{release();}
      if(!stored)return null;
      const snapshot = JSON.parse(stored.bytes.toString("utf8")) as PersistedSessionSnapshot;
      this.memorySnapshot = snapshot;
      return snapshot;
    } catch (error) {
      appendContinuityLog({
        event: "storage_failure",
        level: "warn",
        details: "Failed to load session snapshot — initialization refused",
      });
      throw error;
    }
  }

  save(model: SessionContinuityModel, actorIdentifier: string | null): boolean {
    const snapshot: PersistedSessionSnapshot = {
      sessionId: model.sessionId,
      actorIdentifier,
      lastContinuity: model,
      lastPersistedAt: new Date().toISOString(),
      restartDetected: false,
    };
    if (!this.config.persistSessionContext) {this.memorySnapshot=snapshot;return true;}
    try {
      const dir = join(this.repositoryRoot, this.config.persistenceRoot);
      const release=acquireSessionContinuityLock(dir),temporary=join(dir,`.session-snapshot-${randomUUID()}.tmp`);
      try {
        if (!existsSync(dir)) mkdirSync(dir);
        const fd=fs.openSync(temporary,"wx",0o600);
        try{fs.writeFileSync(fd,JSON.stringify(snapshot,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
        fs.renameSync(temporary,this.getSnapshotPath());
        const directory=fs.openSync(dir,"r");try{fs.fsyncSync(directory);}finally{fs.closeSync(directory);}
        this.memorySnapshot=snapshot;
      }finally{fs.rmSync(temporary,{force:true});release();}
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Snapshot save failed";
      appendContinuityLog({ event: "storage_failure", level: "error", details: message });
      return false;
    }
  }

  withRecoverySnapshot<T>(capture:(snapshot:SessionContinuityRecoverySnapshot)=>Promise<T>):Promise<T>{
    return withSessionContinuitySnapshot(join(this.repositoryRoot,this.config.persistenceRoot),this.config.persistSessionContext,capture);
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
