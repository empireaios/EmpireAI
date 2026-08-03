import type { MemoryRecord } from "./types.js";
/** Selects recorded strategic and operational decisions without exposing payloads. */
export class DecisionArchiveEngine {
  select(records: MemoryRecord[]) { return records.filter((record) => record.memoryCategory === "strategic_decision" || record.memoryCategory === "operational_decision"); }
}
