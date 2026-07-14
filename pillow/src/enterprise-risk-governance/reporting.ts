/** E5-09 — Risk reporting and metrics. */

import type { RiskExecutiveReport, RiskMetrics, RiskAuditLogEntry } from "./types.js";

export function buildRiskExecutiveReport(input: {
  riskHealth: string;
  totalRisks: number;
  criticalRisks: number;
  auditHistory: RiskAuditLogEntry[];
}): RiskExecutiveReport {
  const mitigatedCount = input.auditHistory.filter((e) => e.newStatus === "resolved").length;
  return {
    currentStatus: input.riskHealth,
    totalRisks: input.totalRisks,
    criticalRisks: input.criticalRisks,
    mitigatedCount,
    executiveSummary: `${input.totalRisks} enterprise risks · ${input.criticalRisks} critical · ${mitigatedCount} mitigated`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildRiskMetrics(input: {
  records: Array<{ severity: string; status: string }>;
  mitigationProgress: Array<{ progress: number }>;
}): RiskMetrics {
  const severities = input.records.map((r) => r.severity);
  const statuses = input.records.map((r) => r.status);
  const avgProgress =
    input.mitigationProgress.length > 0
      ? Math.round(
          input.mitigationProgress.reduce((a, b) => a + b.progress, 0) /
            input.mitigationProgress.length,
        )
      : 0;
  return {
    totalRisks: input.records.length,
    criticalCount: severities.filter((s) => s === "critical").length,
    highCount: severities.filter((s) => s === "high").length,
    mediumCount: severities.filter((s) => s === "medium").length,
    lowCount: severities.filter((s) => s === "low").length,
    mitigatingCount: statuses.filter((s) => s === "mitigating").length,
    resolvedCount: statuses.filter((s) => s === "resolved").length,
    averageMitigationProgress: avgProgress,
  };
}

export function computeExposureScore(probability: number, severity: string): number {
  const severityWeight: Record<string, number> = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100,
  };
  return Math.round((probability / 100) * (severityWeight[severity] ?? 50));
}
