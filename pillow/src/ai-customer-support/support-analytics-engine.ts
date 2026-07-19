/** R4-08 — Support analytics engine. */

import type { AiSupportRecord } from "./types.js";

export class SupportAnalyticsEngine {
  summarize(records: AiSupportRecord[]): {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    failed: number;
    escalated: number;
    byChannel: Record<string, number>;
    byIntent: Record<string, number>;
  } {
    const byChannel: Record<string, number> = {};
    const byIntent: Record<string, number> = {};
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    let failed = 0;
    let escalated = 0;

    for (const r of records) {
      byChannel[r.communicationChannel] = (byChannel[r.communicationChannel] ?? 0) + 1;
      byIntent[r.customerIntent] = (byIntent[r.customerIntent] ?? 0) + 1;
      if (r.resolutionStatus === "open") open += 1;
      if (r.resolutionStatus === "in_progress") inProgress += 1;
      if (r.resolutionStatus === "resolved") resolved += 1;
      if (r.resolutionStatus === "failed") failed += 1;
      if (r.escalationStatus === "escalated" || r.escalationStatus === "pending") escalated += 1;
    }

    return { total: records.length, open, inProgress, resolved, failed, escalated, byChannel, byIntent };
  }

  toMachineReadable(record: AiSupportRecord): Record<string, unknown> {
    return {
      aiSupportRecordId: record.aiSupportRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      conversationReference: record.conversationReference,
      communicationChannel: record.communicationChannel,
      customerIntent: record.customerIntent,
      aiResponseReference: record.aiResponseReference,
      escalationStatus: record.escalationStatus,
      resolutionStatus: record.resolutionStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
