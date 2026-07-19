/** R4-07 — Chat timeline mapper. */

import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendLciLog } from "./lci-logging.js";

export class ChatTimelineMapper {
  mapSessionCreated(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; chatSessionId: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordSupportActivity({
        customerId: input.customerId,
        eventReference: input.chatSessionId,
        eventDescription: `Live chat session created: ${input.chatSessionId}`,
        eventSource: "support",
      });
      const timelineId = report.timelineRecords[0]?.timelineRecordId ?? null;
      appendLciLog({
        event: "timeline_link",
        level: "info",
        details: `Session ${input.chatSessionId} linked to timeline ${timelineId}`,
      });
      return timelineId;
    } catch {
      return null;
    }
  }

  mapCustomerMessage(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; messageId: string; body: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordCommunication({
        customerId: input.customerId,
        eventReference: input.messageId,
        eventDescription: `Live chat customer message: ${input.body.slice(0, 80)}`,
        eventSource: "communication",
      });
      return report.timelineRecords[0]?.timelineRecordId ?? null;
    } catch {
      return null;
    }
  }

  mapSupportResponse(
    timelineEngine: CustomerTimelineEngine | null,
    input: { customerId: string; messageId: string; handlerId: string },
  ): string | null {
    if (!timelineEngine) return null;
    try {
      const report = timelineEngine.recordSupportActivity({
        customerId: input.customerId,
        eventReference: input.messageId,
        eventDescription: `Live chat support response from ${input.handlerId}`,
        eventSource: "support",
      });
      return report.timelineRecords[0]?.timelineRecordId ?? null;
    } catch {
      return null;
    }
  }
}
