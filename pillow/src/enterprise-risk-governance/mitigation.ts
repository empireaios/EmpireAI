/** E5-09 — Mitigation planning and progress tracking. */

import type {
  EnterpriseRiskRecord,
  MitigationProgressEntry,
  CriticalRiskEntry,
} from "./types.js";

export function buildMitigationProgress(records: EnterpriseRiskRecord[]): MitigationProgressEntry[] {
  return records
    .filter((r) => r.status === "mitigating" || r.status === "prioritized" || r.status === "monitoring")
    .map((r) => ({
      progressId: `mit-${r.riskId}`,
      riskId: r.riskId,
      title: r.riskTitle,
      owner: r.owner,
      mitigationPlan: r.mitigationPlan,
      progress: r.status === "resolved" ? 100 : r.status === "mitigating" ? 65 : r.status === "monitoring" ? 85 : 40,
      residualRisk: r.residualRisk,
      status: r.status,
    }));
}

export function buildCriticalRisks(records: EnterpriseRiskRecord[]): CriticalRiskEntry[] {
  return records
    .filter((r) => r.severity === "critical" || r.severity === "high")
    .map((r) => ({
      criticalId: `crit-${r.riskId}`,
      riskId: r.riskId,
      title: r.riskTitle,
      category: r.category,
      owner: r.owner,
      severity: r.severity,
      mitigationProgress: r.status === "mitigating" ? 65 : r.status === "monitoring" ? 85 : 35,
      status: r.status,
    }));
}

export function hasMitigationPlan(record: EnterpriseRiskRecord): boolean {
  return record.mitigationPlan.trim().length > 0 && record.mitigationPlan !== "Pending";
}
