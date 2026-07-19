/** R4-09 — Ticket timeline mapper. */

import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendTmeLog } from "./tme-logging.js";

export class TicketTimelineMapper {
  mapTicketCreated(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; ticketId: string; subject: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordSupportActivity({
        customerId: input.customerId,
        eventReference: input.ticketId,
        eventDescription: `Support ticket created: ${input.subject.slice(0, 80)}`,
        eventSource: "support",
      });
      const timelineId = report.timelineRecords[0]?.timelineRecordId ?? null;
      appendTmeLog({
        event: "timeline_link",
        level: "info",
        details: `Ticket ${input.ticketId} linked to timeline ${timelineId}`,
      });
      return timelineId;
    } catch {
      return null;
    }
  }

  mapStatusChange(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; ticketId: string; status: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordSupportActivity({
        customerId: input.customerId,
        eventReference: input.ticketId,
        eventDescription: `Ticket status changed to ${input.status}`,
        eventSource: "support",
      });
      return report.timelineRecords[0]?.timelineRecordId ?? null;
    } catch {
      return null;
    }
  }

  mapConversationLink(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; ticketId: string; conversationReference: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordCommunication({
        customerId: input.customerId,
        eventReference: input.conversationReference,
        eventDescription: `Ticket ${input.ticketId} linked to conversation ${input.conversationReference}`,
        eventSource: "communication",
      });
      return report.timelineRecords[0]?.timelineRecordId ?? null;
    } catch {
      return null;
    }
  }
}
