/** R4-07 — Live chat analytics engine. */

import type { LiveChatRecord } from "./types.js";

export class ChatAnalyticsEngine {
  summarize(records: LiveChatRecord[]): {
    total: number;
    waiting: number;
    active: number;
    assigned: number;
    failed: number;
    resolved: number;
    closed: number;
    averageResponseTimeMs: number;
  } {
    let waiting = 0;
    let active = 0;
    let assigned = 0;
    let failed = 0;
    let resolved = 0;
    let closed = 0;
    let responseSum = 0;
    let responseCount = 0;

    for (const r of records) {
      if (r.chatStatus === "waiting") waiting += 1;
      if (r.chatStatus === "active") active += 1;
      if (r.chatStatus === "assigned") assigned += 1;
      if (r.chatStatus === "failed") failed += 1;
      if (r.chatStatus === "resolved") resolved += 1;
      if (r.chatStatus === "closed") closed += 1;
      if (r.responseTimeMs != null) {
        responseSum += r.responseTimeMs;
        responseCount += 1;
      }
    }

    return {
      total: records.length,
      waiting,
      active,
      assigned,
      failed,
      resolved,
      closed,
      averageResponseTimeMs: responseCount > 0 ? Math.round(responseSum / responseCount) : 0,
    };
  }

  toMachineReadable(record: LiveChatRecord): Record<string, unknown> {
    return {
      chatSessionId: record.chatSessionId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      conversationId: record.conversationId,
      messageReferences: record.messageReferences,
      chatStatus: record.chatStatus,
      assignedHandler: record.assignedHandler,
      responseTimeMs: record.responseTimeMs,
      relatedTimelineEvent: record.relatedTimelineEvent,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
