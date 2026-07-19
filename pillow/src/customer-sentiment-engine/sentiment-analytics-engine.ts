/** R4-10 — Sentiment analytics engine. */

import type { SentimentRecord } from "./types.js";

export class SentimentAnalyticsEngine {
  summarize(records: SentimentRecord[]): {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    frustrated: number;
    satisfied: number;
    escalationRisk: number;
    activeAlerts: number;
    failed: number;
    byChannel: Record<string, number>;
    averageScore: number;
  } {
    const byChannel: Record<string, number> = {};
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let frustrated = 0;
    let satisfied = 0;
    let escalationRisk = 0;
    let activeAlerts = 0;
    let failed = 0;
    let scoreSum = 0;

    for (const r of records) {
      byChannel[r.communicationChannel] = (byChannel[r.communicationChannel] ?? 0) + 1;
      scoreSum += r.sentimentScore;
      if (r.sentimentCategory === "positive") positive += 1;
      if (r.sentimentCategory === "neutral") neutral += 1;
      if (r.sentimentCategory === "negative") negative += 1;
      if (r.sentimentCategory === "frustrated") frustrated += 1;
      if (r.sentimentCategory === "satisfied") satisfied += 1;
      if (r.sentimentCategory === "escalation_risk") escalationRisk += 1;
      if (r.alertStatus === "active" || r.alertStatus === "pending") activeAlerts += 1;
      if (r.validationStatus === "failed") failed += 1;
    }

    return {
      total: records.length,
      positive,
      neutral,
      negative,
      frustrated,
      satisfied,
      escalationRisk,
      activeAlerts,
      failed,
      byChannel,
      averageScore: records.length > 0 ? Math.round(scoreSum / records.length) : 0,
    };
  }

  toMachineReadable(record: SentimentRecord): Record<string, unknown> {
    return {
      sentimentRecordId: record.sentimentRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      conversationReference: record.conversationReference,
      communicationChannel: record.communicationChannel,
      sentimentScore: record.sentimentScore,
      sentimentCategory: record.sentimentCategory,
      confidenceScore: record.confidenceScore,
      alertStatus: record.alertStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
