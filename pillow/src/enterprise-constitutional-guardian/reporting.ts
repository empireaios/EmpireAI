/** E5-13 — Guardian reporting and metrics. */

import type { GuardianExecutiveReport, GuardianMetrics } from "./types.js";

export function buildGuardianExecutiveReport(input: {
  constitutionHealth: string;
  constitutionHealthScore: number;
  protectedAssetCount: number;
  activeViolations: number;
}): GuardianExecutiveReport {
  return {
    currentStatus: input.constitutionHealth,
    constitutionHealthScore: input.constitutionHealthScore,
    protectedAssetCount: input.protectedAssetCount,
    activeViolations: input.activeViolations,
    executiveSummary: `Constitution health ${input.constitutionHealthScore}/100 · ${input.protectedAssetCount} protected assets · ${input.activeViolations} active violations`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildGuardianMetrics(input: {
  records: Array<{ currentStatus: string; confidence: number }>;
  protectedAssetCount: number;
  constitutionHealthScore: number;
  repositoryIntegrityScore: number;
  architectureIntegrityScore: number;
}): GuardianMetrics {
  const statuses = input.records.map((r) => r.currentStatus);
  const avgConfidence =
    input.records.length > 0
      ? Math.round(input.records.reduce((a, b) => a + b.confidence, 0) / input.records.length)
      : 0;
  return {
    totalEvents: input.records.length,
    activeViolationCount: statuses.filter((s) => s === "detected" || s === "validated" || s === "action_recommended").length,
    resolvedCount: statuses.filter((s) => s === "resolved" || s === "action_taken").length,
    protectedAssetCount: input.protectedAssetCount,
    averageConfidence: avgConfidence,
    constitutionHealthScore: input.constitutionHealthScore,
    repositoryIntegrityScore: input.repositoryIntegrityScore,
    architectureIntegrityScore: input.architectureIntegrityScore,
  };
}
