import type { AuditStore } from "./audit-store.js";
import type { AuditQuery, AuditRecord } from "./types.js";

/**
 * Filter by category/missionId/workerId/factoryId/time range.
 * Deterministic sort: timestamp then auditRecordId.
 */
export class AuditQueryEngine {
  query(store: AuditStore, query: AuditQuery = {}): AuditRecord[] {
    return store.query(query);
  }

  export(store: AuditStore, query: AuditQuery = {}): AuditRecord[] {
    return store.exportRecords(query);
  }
}
