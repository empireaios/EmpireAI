/** T1-08 — Persistent storage for visual memory records. */

import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";
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

export class MemoryPersistenceStore {
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
