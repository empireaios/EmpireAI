/** E5-11 — Policy evolution reporting and metrics. */

import type {
  PolicyEvolutionExecutiveReport,
  PolicyEvolutionMetrics,
  PolicyEvolutionAuditLogEntry,
} from "./types.js";

export function buildPolicyEvolutionExecutiveReport(input: {
  evolutionHealth: string;
  totalEvolutions: number;
  pendingEvolutions: number;
  auditHistory: PolicyEvolutionAuditLogEntry[];
}): PolicyEvolutionExecutiveReport {
  const publishedEvolutions = input.auditHistory.filter((e) => e.newStatus === "published").length;
  return {
    currentStatus: input.evolutionHealth,
    totalEvolutions: input.totalEvolutions,
    pendingEvolutions: input.pendingEvolutions,
    publishedEvolutions,
    executiveSummary: `${input.totalEvolutions} policy evolutions · ${input.pendingEvolutions} pending · ${publishedEvolutions} published`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildPolicyEvolutionMetrics(input: {
  records: Array<{ approvalStatus: string; confidence: number }>;
  governanceStabilityScore: number;
  policyStabilityScore: number;
}): PolicyEvolutionMetrics {
  const statuses = input.records.map((r) => r.approvalStatus);
  const avgConfidence =
    input.records.length > 0
      ? Math.round(input.records.reduce((a, b) => a + b.confidence, 0) / input.records.length)
      : 0;
  return {
    totalEvolutions: input.records.length,
    pendingCount: statuses.filter((s) => s === "pending_review" || s === "pending_approval" || s === "draft").length,
    approvedCount: statuses.filter((s) => s === "approved").length,
    publishedCount: statuses.filter((s) => s === "published").length,
    averageConfidence: avgConfidence,
    policyStabilityScore: input.policyStabilityScore,
    governanceStabilityScore: input.governanceStabilityScore,
  };
}
