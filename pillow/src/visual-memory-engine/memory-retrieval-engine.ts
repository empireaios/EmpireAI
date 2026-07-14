/** T1-08 — Memory retrieval engine. */

import { appendMemoryLog } from "./memory-logging.js";
import type { MemoryIndexer } from "./memory-indexer.js";
import type { MemoryPersistenceStore } from "./memory-persistence-store.js";
import type { VisualMemoryConfiguration } from "./configuration.js";
import type { VisualMemoryRecord } from "./types.js";

export class MemoryRetrievalEngine {
  constructor(
    private indexer: MemoryIndexer,
    private store: MemoryPersistenceStore,
    private config: VisualMemoryConfiguration,
  ) {}

  private loadRecords(entries: ReturnType<MemoryIndexer["query"]>): VisualMemoryRecord[] {
    const records: VisualMemoryRecord[] = [];
    for (const entry of entries) {
      const payload = this.store.read(entry.memoryRecordId);
      if (payload?.record) records.push(payload.record);
    }
    return records;
  }

  retrieveRecent(limit?: number): VisualMemoryRecord[] {
    const effectiveLimit = Math.min(limit ?? 20, this.config.retrievalLimit);
    const entries = this.indexer.query({ limit: effectiveLimit });
    const records = this.loadRecords(entries);
    appendMemoryLog({
      event: "memory_retrieval",
      level: "info",
      details: `Retrieved ${records.length} recent records`,
    });
    return records;
  }

  retrieveBySession(sessionId: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      sessionId,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveByScreen(screenId: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      screenId,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveByRoute(routeOrViewId: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      routeOrViewId,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveByComponent(componentId: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      componentId,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveByWorkflowContext(workflowContextId: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      workflowContextId,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveByTimeRange(since: string, until?: string, limit?: number): VisualMemoryRecord[] {
    const entries = this.indexer.query({
      since,
      until,
      limit: limit ?? this.config.retrievalLimit,
    });
    return this.loadRecords(entries);
  }

  retrieveById(memoryRecordId: string): VisualMemoryRecord | null {
    const payload = this.store.read(memoryRecordId);
    if (payload?.record) {
      appendMemoryLog({
        event: "memory_retrieval",
        level: "info",
        details: `Retrieved record ${memoryRecordId}`,
      });
      return payload.record;
    }
    return null;
  }
}
