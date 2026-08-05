import type { MemoryEntry, MemoryVersion } from "./types.js";

export class LineageTracker {
  linkParent(entry: MemoryEntry, parentMemoryId: string | null): MemoryEntry {
    return { ...entry, parentMemoryId };
  }

  buildLineageChain(entry: MemoryEntry, lookup: (id: string) => MemoryEntry | null): string[] {
    const chain: string[] = [entry.memoryId];
    let current = entry.parentMemoryId;
    const visited = new Set<string>([entry.memoryId]);
    while (current && !visited.has(current)) {
      visited.add(current);
      chain.push(current);
      const parent = lookup(current);
      current = parent?.parentMemoryId ?? null;
    }
    return chain;
  }

  getSupersedesLink(version: MemoryVersion): { from: number; to: number } | null {
    if (version.supersedesVersion == null) return null;
    return { from: version.supersedesVersion, to: version.versionNumber };
  }
}
