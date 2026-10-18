/** T1-08 — Persistent storage for visual memory records. */

import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, statSync, lstatSync, realpathSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { acquireVisualMemoryLock } from "./recovery-lock.js";
import { appendMemoryLog } from "./memory-logging.js";
import type { VisualMemoryConfiguration } from "./configuration.js";
import type { MemoryIndexEntry, VisualMemoryRecord } from "./types.js";

export type StoredMemoryPayload = {
  record: VisualMemoryRecord;
  uiStateHistory?: unknown;
  componentHistory?: unknown;
  layoutHistory?: unknown;
  navigationHistory?: unknown;
  interactionHistory?: unknown;
  workflowContextHistory?: unknown;
};

export type VisualMemoryRecoverySnapshot = {schema:"VISUAL_MEMORY_INSPECTION_V1";sourceStoragePath:string;operationalRestoreAvailable:false;files:Array<{path:string;bytes:string;mode:number}>};

export class MemoryPersistenceStore {
  private recoveryHeld = false;
  private writeDepth = 0;
  withWriteTransaction<T>(write:()=>T):T {
    this.assertWritable();
    if(this.config.storageBackend==='memory'||this.writeDepth>0)return write();
    const release=acquireVisualMemoryLock(this.getStorageDir());
    this.writeDepth++;
    try{return write();}finally{this.writeDepth--;release();}
  }
  isRecoveryHeld(): boolean { return this.recoveryHeld; }
  private assertWritable(): void { if (this.recoveryHeld) throw new Error("VISUAL_MEMORY_RECOVERY_HELD"); }
  /** Local single-event-loop writer exclusion only; no global topology claim. */
  async withRecoverySnapshot<T>(capture:(snapshot:VisualMemoryRecoverySnapshot)=>Promise<T>):Promise<T> {
    if(this.recoveryHeld) throw new Error("VISUAL_MEMORY_RECOVERY_ALREADY_HELD");
    if(this.config.storageBackend!=="file") throw new Error("VISUAL_MEMORY_FILE_CAPTURE_REQUIRED");
    const release=acquireVisualMemoryLock(this.getStorageDir());
    this.recoveryHeld=true;
    try {
      const root=resolve(this.getStorageDir());
      if(realpathSync(root)!==root||!lstatSync(root).isDirectory())throw new Error("VISUAL_MEMORY_ROOT_UNSAFE");
      const entries=readdirSync(root).sort();
      if(entries.some(x=>x!=="index.json"&&x!=="records")||!entries.includes("records"))throw new Error("VISUAL_MEMORY_INVENTORY_UNKNOWN");
      const records=join(root,"records");
      if(realpathSync(records)!==records||!lstatSync(records).isDirectory())throw new Error("VISUAL_MEMORY_RECORDS_UNSAFE");
      const names=readdirSync(records).sort();
      if(names.length>10000||names.some(x=>!/^[-a-zA-Z0-9_.]+\.json$/.test(x)))throw new Error("VISUAL_MEMORY_RECORD_NAMES_INVALID");
      let total=0;const files:Array<{path:string;bytes:string;mode:number}>=[];
      for(const name of [...(entries.includes("index.json")?["index.json"]:[]),...names.map(x=>"records/"+x)]) {
        const filename=join(root,name),st=lstatSync(filename);
        if(!st.isFile()||st.nlink!==1||realpathSync(filename)!==filename)throw new Error("VISUAL_MEMORY_FILE_UNSAFE");
        total+=st.size;if(total>33554432)throw new Error("VISUAL_MEMORY_CAPTURE_SIZE");
        const bytes=readFileSync(filename);JSON.parse(bytes.toString("utf8"));
        files.push({path:name,bytes:bytes.toString("base64"),mode:st.mode&0o777});
      }
      return await capture({schema:"VISUAL_MEMORY_INSPECTION_V1",sourceStoragePath:root,operationalRestoreAvailable:false,files});
    } finally {try{release();}finally{this.recoveryHeld=false;}}
  }

  private memoryRecords = new Map<string, StoredMemoryPayload>();
  private memoryIndex: MemoryIndexEntry[] = [];

  constructor(
    private repositoryRoot: string,
    private config: VisualMemoryConfiguration,
  ) {}

  getStorageDir(): string {
    return join(this.repositoryRoot, this.config.storageRoot);
  }

  getRecordsDir(): string {
    return join(this.getStorageDir(), "records");
  }

  getIndexPath(): string {
    return join(this.getStorageDir(), "index.json");
  }

  getRecordPath(memoryRecordId: string): string {
    return join(this.getRecordsDir(), `${memoryRecordId}.json`);
  }

  initialize(): void {
    if(this.config.storageBackend!=="memory")mkdirSync(resolve(this.getStorageDir(),".."),{recursive:true});
    return this.withWriteTransaction(()=>this.initializeAdmitted());
  }

  private initializeAdmitted(): void {
    this.assertWritable();
    if (this.config.storageBackend === "memory") return;
    const dir = this.getStorageDir();
    const recordsDir = this.getRecordsDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(recordsDir)) mkdirSync(recordsDir, { recursive: true });
    this.loadIndex();
  }

  loadIndex(): MemoryIndexEntry[] {
    if (this.config.storageBackend === "memory") return this.memoryIndex;
    const indexPath = this.getIndexPath();
    if (!existsSync(indexPath)) return [];
    try {
      const data = JSON.parse(readFileSync(indexPath, "utf8")) as { entries?: MemoryIndexEntry[] };
      this.memoryIndex = data.entries ?? [];
      return this.memoryIndex.map((e) => ({ ...e, componentIds: [...e.componentIds] }));
    } catch {
      appendMemoryLog({
        event: "storage_failure",
        level: "warn",
        details: "Failed to load memory index — starting fresh",
      });
      return [];
    }
  }

  saveIndex(entries: MemoryIndexEntry[]): void {
    return this.withWriteTransaction(()=>this.saveIndexAdmitted(entries));
  }

  private saveIndexAdmitted(entries: MemoryIndexEntry[]): void {
    this.assertWritable();
    this.memoryIndex = entries.map((e) => ({ ...e, componentIds: [...e.componentIds] }));
    if (this.config.storageBackend === "memory") return;
    try {
      writeFileSync(
        this.getIndexPath(),
        JSON.stringify({ version: "1.0.0", entries: this.memoryIndex }, null, 2),
        "utf8",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Index save failed";
      appendMemoryLog({ event: "storage_failure", level: "error", details: message });
      throw error;
    }
  }

  write(payload: StoredMemoryPayload): number {
    return this.withWriteTransaction(()=>this.writeAdmitted(payload));
  }

  private writeAdmitted(payload: StoredMemoryPayload): number {
    this.assertWritable();
    const recordPath = this.getRecordPath(payload.record.memoryRecordId);
    const json = JSON.stringify(payload, null, 2);
    const bytes = Buffer.byteLength(json, "utf8");

    if (this.config.storageBackend === "memory") {
      this.memoryRecords.set(payload.record.memoryRecordId, payload);
      return bytes;
    }

    try {
      writeFileSync(recordPath, json, "utf8");
      return bytes;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Record write failed";
      appendMemoryLog({ event: "storage_failure", level: "error", details: message });
      throw error;
    }
  }

  read(memoryRecordId: string): StoredMemoryPayload | null {
    if (this.config.storageBackend === "memory") {
      const payload = this.memoryRecords.get(memoryRecordId);
      return payload ? structuredClone(payload) : null;
    }
    const recordPath = this.getRecordPath(memoryRecordId);
    if (!existsSync(recordPath)) return null;
    try {
      return JSON.parse(readFileSync(recordPath, "utf8")) as StoredMemoryPayload;
    } catch {
      appendMemoryLog({
        event: "storage_failure",
        level: "warn",
        details: `Corrupted record ${memoryRecordId}`,
      });
      return null;
    }
  }

  delete(memoryRecordId: string): void {
    return this.withWriteTransaction(()=>this.deleteAdmitted(memoryRecordId));
  }

  private deleteAdmitted(memoryRecordId: string): void {
    this.assertWritable();
    if (this.config.storageBackend === "memory") {
      this.memoryRecords.delete(memoryRecordId);
      return;
    }
    const recordPath = this.getRecordPath(memoryRecordId);
    if (existsSync(recordPath)) {
      try {
        unlinkSync(recordPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Record delete failed";
        appendMemoryLog({ event: "storage_failure", level: "warn", details: message });
      }
    }
  }

  getStorageStats(): { totalRecords: number; usedBytes: number } {
    if (this.config.storageBackend === "memory") {
      let usedBytes = 0;
      for (const payload of this.memoryRecords.values()) {
        usedBytes += Buffer.byteLength(JSON.stringify(payload), "utf8");
      }
      return { totalRecords: this.memoryIndex.length, usedBytes };
    }

    let usedBytes = 0;
    for (const entry of this.memoryIndex) {
      const path = this.getRecordPath(entry.memoryRecordId);
      if (existsSync(path)) {
        try {
          usedBytes += statSync(path).size;
        } catch {
          // skip unreadable files
        }
      }
    }
    return { totalRecords: this.memoryIndex.length, usedBytes };
  }

  resetForTesting(): void {
    this.memoryRecords.clear();
    this.memoryIndex = [];
  }
}
