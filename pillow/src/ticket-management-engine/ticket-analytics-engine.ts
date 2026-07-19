/** R4-09 — Ticket analytics engine. */

import type { TicketRecord } from "./types.js";

export class TicketAnalyticsEngine {
  summarize(records: TicketRecord[]): {
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    failed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let open = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let failed = 0;

    for (const r of records) {
      byCategory[r.ticketCategory] = (byCategory[r.ticketCategory] ?? 0) + 1;
      byPriority[r.ticketPriority] = (byPriority[r.ticketPriority] ?? 0) + 1;
      if (r.currentStatus === "open") open += 1;
      if (r.currentStatus === "assigned") assigned += 1;
      if (r.currentStatus === "in_progress") inProgress += 1;
      if (r.currentStatus === "resolved") resolved += 1;
      if (r.currentStatus === "closed") closed += 1;
      if (r.currentStatus === "failed") failed += 1;
    }

    return {
      total: records.length,
      open,
      assigned,
      inProgress,
      resolved,
      closed,
      failed,
      byCategory,
      byPriority,
    };
  }

  toMachineReadable(record: TicketRecord): Record<string, unknown> {
    return {
      ticketId: record.ticketId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      conversationReference: record.conversationReference,
      ticketCategory: record.ticketCategory,
      ticketPriority: record.ticketPriority,
      assignedOwner: record.assignedOwner,
      currentStatus: record.currentStatus,
      resolutionStatus: record.resolutionStatus,
      relatedTimelineReference: record.relatedTimelineReference,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
