/** E5-12 — Trust reporting and metrics. */

import type { TrustExecutiveReport, TrustMetrics, TrustAuditLogEntry } from "./types.js";

export function buildTrustExecutiveReport(input: {
  trustHealth: string;
  executiveTrustScore: number;
  governanceTrustScore: number;
  decisionConfidence: number;
}): TrustExecutiveReport {
  return {
    currentStatus: input.trustHealth,
    executiveTrustScore: input.executiveTrustScore,
    governanceTrustScore: input.governanceTrustScore,
    decisionConfidence: input.decisionConfidence,
    executiveSummary: `Executive trust ${input.executiveTrustScore}/100 · Governance trust ${input.governanceTrustScore}/100 · Decision confidence ${input.decisionConfidence}/100`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildTrustMetrics(input: {
  records: Array<{ trustScore: number; confidenceScore: number }>;
  executiveTrustScore: number;
  governanceTrustScore: number;
}): TrustMetrics {
  const avgTrust =
    input.records.length > 0
      ? Math.round(input.records.reduce((a, b) => a + b.trustScore, 0) / input.records.length)
      : 0;
  const avgConfidence =
    input.records.length > 0
      ? Math.round(input.records.reduce((a, b) => a + b.confidenceScore, 0) / input.records.length)
      : 0;
  return {
    totalAssessments: input.records.length,
    averageTrustScore: avgTrust,
    averageConfidenceScore: avgConfidence,
    highTrustCount: input.records.filter((r) => r.trustScore >= 85).length,
    lowTrustCount: input.records.filter((r) => r.trustScore < 70).length,
    governanceTrustScore: input.governanceTrustScore,
    executiveTrustScore: input.executiveTrustScore,
  };
}
