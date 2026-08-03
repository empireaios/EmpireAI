import type { MemoryRecord } from "./types.js";
/** Produces an immutable chronological structural view of historical memory. */
export class HistoricalTimelineEngine {
  order(records: MemoryRecord[]) { return [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp)); }
}
