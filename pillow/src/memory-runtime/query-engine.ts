import type { MemoryEntry, RetrievalQuery } from "./types.js";

export function compareEntries(a: MemoryEntry, b: MemoryEntry): number {
  const createdCompare = a.createdAt.localeCompare(b.createdAt);
  if (createdCompare !== 0) return createdCompare;
  return a.memoryId.localeCompare(b.memoryId);
}

export function sortEntriesDeterministic(entries: MemoryEntry[]): MemoryEntry[] {
  return [...entries].sort(compareEntries);
}

export class QueryEngine {
  query(entries: MemoryEntry[], query: RetrievalQuery): MemoryEntry[] {
    let matches = [...entries];

    if (query.memoryType) {
      matches = matches.filter((e) => e.memoryType === query.memoryType);
    }
    if (query.factory) {
      matches = matches.filter((e) => e.factory === query.factory);
    }
    if (query.worker) {
      matches = matches.filter((e) => e.worker === query.worker);
    }
    if (query.missionId) {
      matches = matches.filter((e) => e.missionId === query.missionId);
    }
    if (query.sessionId) {
      matches = matches.filter((e) => e.sessionId === query.sessionId);
    }
    if (query.contextId) {
      matches = matches.filter((e) => e.contextId === query.contextId);
    }
    if (query.tag) {
      matches = matches.filter((e) => e.tags.includes(query.tag!));
    }
    if (query.text) {
      const needle = query.text.toLowerCase();
      matches = matches.filter(
        (e) =>
          e.summary.toLowerCase().includes(needle) ||
          e.tags.some((t) => t.toLowerCase().includes(needle)),
      );
    }

    return sortEntriesDeterministic(matches);
  }
}
