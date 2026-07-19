/** R4-14 — Abuse Detection Engine. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";

export class AbuseDetectionEngine {
  detect(input: {
    returnCountThisMonth: number;
    ticketCount: number;
    timelineEventCount: number;
    config: CustomerRiskEngineConfiguration;
  }): { indicators: string[]; score: number } {
    const indicators: string[] = [];
    let score = 0;

    if (input.returnCountThisMonth >= input.config.maxReturnsForAbuseFlag) {
      indicators.push("return_abuse_threshold");
      score += 25;
    }
    if (input.ticketCount >= input.config.maxTicketsForAbuseFlag) {
      indicators.push("ticket_abuse_threshold");
      score += 20;
    }
    if (input.timelineEventCount > 50) {
      indicators.push("excessive_account_activity");
      score += 15;
    }

    return { indicators, score: Math.min(100, score) };
  }
}
