/** T1-08 — Memory retention and cleanup. */

import { appendMemoryLog } from "./memory-logging.js";
import type { MemoryIndexer } from "./memory-indexer.js";
import type { MemoryPersistenceStore } from "./memory-persistence-store.js";
import type { VisualMemoryConfiguration } from "./configuration.js";
import type { RetentionCategory } from "./types.js";

export class MemoryRetentionManager {
  applyRetention(
    indexer: MemoryIndexer,
    store: MemoryPersistenceStore,
    config: VisualMemoryConfiguration,
  ): number {
    const now = Date.now();
    const entries = indexer.getAll();
    let removed = 0;

    const retentionFor = (category: RetentionCategory): number => {
      if (category === "snapshot") return config.snapshotRetentionDurationMs;
      if (category === "extended") return config.retentionDurationMs * 2;
      if (category === "ephemeral") return config.memoryCaptureIntervalMs * 10;
      return config.retentionDurationMs;
    };

    const toRemove: string[] = [];
    for (const entry of entries) {
      const age = now - new Date(entry.timestamp).getTime();
      if (age > retentionFor(entry.retentionCategory)) {
        toRemove.push(entry.memoryRecordId);
      }
    }

    if (entries.length - toRemove.length > config.maxRecords) {
      const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const overflow = entries.length - toRemove.length - config.maxRecords;
      for (let i = 0; i < overflow; i++) {
        if (!toRemove.includes(sorted[i]!.memoryRecordId)) {
          toRemove.push(sorted[i]!.memoryRecordId);
        }
      }
    }

    const stats = store.getStorageStats();
    if (stats.usedBytes > config.maxStorageSizeBytes) {
      const sorted = [...entries]
        .filter((e) => !toRemove.includes(e.memoryRecordId))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      for (const entry of sorted) {
        if (store.getStorageStats().usedBytes <= config.maxStorageSizeBytes * 0.8) break;
        if (!toRemove.includes(entry.memoryRecordId)) {
          toRemove.push(entry.memoryRecordId);
        }
      }
    }

    for (const id of toRemove) {
      store.delete(id);
      indexer.remove(id);
      removed += 1;
    }

    if (removed > 0) {
      store.saveIndex(indexer.getAll());
      appendMemoryLog({
        event: "retention_cleanup",
        level: "info",
        details: `Removed ${removed} expired memory records`,
      });
    }

    return removed;
  }
}
