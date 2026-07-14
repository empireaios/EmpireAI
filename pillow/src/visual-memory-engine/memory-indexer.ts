/** T1-08 — Memory index for fast retrieval. */

import type { MemoryIndexEntry, VisualMemoryRecord } from "./types.js";

export class MemoryIndexer {
  private entries: MemoryIndexEntry[] = [];

  index(record: VisualMemoryRecord, componentIds: string[]): void {
    this.entries.push({
      memoryRecordId: record.memoryRecordId,
      sessionId: record.sessionId,
      timestamp: record.timestamp,
      screenId: record.screenId,
      routeOrViewId: record.routeOrViewId,
      sourceWorkflowContextId: record.sourceWorkflowContextId,
      componentIds,
      retentionCategory: record.retentionCategory,
      storageLocation: record.storageLocation,
    });
  }

  remove(memoryRecordId: string): void {
    this.entries = this.entries.filter((e) => e.memoryRecordId !== memoryRecordId);
  }

  getAll(): MemoryIndexEntry[] {
    return this.entries.map((e) => ({ ...e, componentIds: [...e.componentIds] }));
  }

  setEntries(entries: MemoryIndexEntry[]): void {
    this.entries = entries.map((e) => ({ ...e, componentIds: [...e.componentIds] }));
  }

  size(): number {
    return this.entries.length;
  }

  query(filter: {
    sessionId?: string;
    screenId?: string;
    routeOrViewId?: string;
    componentId?: string;
    workflowContextId?: string;
    since?: string;
    until?: string;
    limit?: number;
  }): MemoryIndexEntry[] {
    let results = [...this.entries];
    if (filter.sessionId) results = results.filter((e) => e.sessionId === filter.sessionId);
    if (filter.screenId) results = results.filter((e) => e.screenId === filter.screenId);
    if (filter.routeOrViewId) {
      results = results.filter((e) => e.routeOrViewId === filter.routeOrViewId);
    }
    if (filter.componentId) {
      results = results.filter((e) => e.componentIds.includes(filter.componentId!));
    }
    if (filter.workflowContextId) {
      results = results.filter(
        (e) => e.sourceWorkflowContextId === filter.workflowContextId,
      );
    }
    if (filter.since) results = results.filter((e) => e.timestamp >= filter.since!);
    if (filter.until) results = results.filter((e) => e.timestamp <= filter.until!);
    results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const limit = filter.limit ?? 100;
    return results.slice(0, limit);
  }
}
