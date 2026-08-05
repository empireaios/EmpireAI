import { nextMemrtId } from "./memory-store.js";
import type { MemoryStore } from "./memory-store.js";
import type { QueryEngine } from "./query-engine.js";
import type { MemrtInput, MemoryEntry, RetrievalQuery, RetrievalResult } from "./types.js";

export class MemoryReader {
  constructor(private readonly queryEngine: QueryEngine) {}

  retrieve(store: MemoryStore, input: MemrtInput): MemoryEntry | null {
    if (input.memoryId) {
      const entry = store.getEntry(input.memoryId);
      if (entry) {
        return store.updateLastAccess(entry.memoryId, new Date().toISOString());
      }
      return null;
    }
    return null;
  }

  query(store: MemoryStore, query: RetrievalQuery): RetrievalResult {
    const matches = this.queryEngine.query(store.listEntries(), query);
    const retrievedAt = new Date().toISOString();
    for (const match of matches) {
      store.updateLastAccess(match.memoryId, retrievedAt);
    }
    const result: RetrievalResult = {
      queryId: nextMemrtId("memrt-qry"),
      query,
      matches,
      matchCount: matches.length,
      retrievedAt,
      deterministicOrdering: true,
    };
    store.saveRetrievalResult(result);
    return result;
  }

  retrieveDecisionHistory(store: MemoryStore, input: MemrtInput): RetrievalResult {
    return this.query(store, {
      memoryType: "decision_history",
      factory: input.factory,
      worker: input.worker,
      missionId: input.missionId,
      sessionId: input.sessionId,
      ...input.query,
    });
  }

  retrievePreviousResults(store: MemoryStore, input: MemrtInput): RetrievalResult {
    return this.query(store, {
      memoryType: "previous_result",
      factory: input.factory,
      worker: input.worker,
      missionId: input.missionId,
      sessionId: input.sessionId,
      ...input.query,
    });
  }

  listVersions(store: MemoryStore, memoryId: string) {
    const entry = store.getEntry(memoryId);
    if (!entry) return [];
    return entry.versions.map((v) => ({ ...v }));
  }
}
