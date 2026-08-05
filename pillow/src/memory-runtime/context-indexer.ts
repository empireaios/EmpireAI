import type { MemoryEntry } from "./types.js";

export type ContextIndexKey = {
  factory: string | null;
  worker: string | null;
  missionId: string | null;
  sessionId: string | null;
  contextId: string | null;
  memoryType: string;
};

export class ContextIndexer {
  buildKey(entry: MemoryEntry): ContextIndexKey {
    return {
      factory: entry.factory,
      worker: entry.worker,
      missionId: entry.missionId,
      sessionId: entry.sessionId,
      contextId: entry.contextId,
      memoryType: entry.memoryType,
    };
  }

  serializeKey(key: ContextIndexKey): string {
    return [
      key.factory ?? "_",
      key.worker ?? "_",
      key.missionId ?? "_",
      key.sessionId ?? "_",
      key.contextId ?? "_",
      key.memoryType,
    ].join("|");
  }

  indexEntries(entries: MemoryEntry[]): Map<string, MemoryEntry[]> {
    const index = new Map<string, MemoryEntry[]>();
    for (const entry of entries) {
      const serialized = this.serializeKey(this.buildKey(entry));
      const bucket = index.get(serialized) ?? [];
      bucket.push(entry);
      index.set(serialized, bucket);
    }
    return index;
  }

  findRelated(
    entries: MemoryEntry[],
    criteria: Partial<ContextIndexKey>,
  ): MemoryEntry[] {
    return entries.filter((entry) => {
      const key = this.buildKey(entry);
      if (criteria.factory != null && key.factory !== criteria.factory) return false;
      if (criteria.worker != null && key.worker !== criteria.worker) return false;
      if (criteria.missionId != null && key.missionId !== criteria.missionId) return false;
      if (criteria.sessionId != null && key.sessionId !== criteria.sessionId) return false;
      if (criteria.contextId != null && key.contextId !== criteria.contextId) return false;
      if (criteria.memoryType != null && key.memoryType !== criteria.memoryType) return false;
      return true;
    });
  }
}
