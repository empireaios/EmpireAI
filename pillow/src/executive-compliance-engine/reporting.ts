/** E5-04 — Executive compliance reporting services. */

import type {
  ComplianceExecutiveReport,
  ComplianceDepartmentSummary,
  ComplianceScorecard,
  ComplianceViolationEntry,
} from "./types.js";
import type { ComplianceEvaluationLogEntry } from "./types.js";

export function buildExecutiveReport(input: {
  complianceScore: number;
  complianceHealth: string;
  activeViolationCount: number;
  criticalViolationCount: number;
  activeViolations: ComplianceViolationEntry[];
  logs: ComplianceEvaluationLogEntry[];
}): ComplianceExecutiveReport {
  const historical = input.logs.slice(-20);
  const violationTrend = historical.filter((l) => l.result === "VIOLATION" || l.result === "CRITICAL").length;

  return {
    currentStatus: input.complianceHealth,
    complianceScore: input.complianceScore,
    activeViolations: input.activeViolationCount,
    criticalViolations: input.criticalViolationCount,
    violationTrend,
    executiveSummary: `${input.complianceScore}% compliance score · ${input.activeViolationCount} active violations · ${input.criticalViolationCount} critical`,
    policyEffectiveness: input.complianceScore >= 95 ? "excellent" : input.complianceScore >= 85 ? "effective" : "review_required",
    generatedAt: new Date().toISOString(),
  };
}

export function buildDepartmentSummaries(
  violations: ComplianceViolationEntry[],
): ComplianceDepartmentSummary[] {
  const byDomain = new Map<string, ComplianceViolationEntry[]>();
  for (const v of violations) {
    const list = byDomain.get(v.domain) ?? [];
    list.push(v);
    byDomain.set(v.domain, list);
  }
  return [...byDomain.entries()].map(([department, items]) => ({
    department,
    violationCount: items.length,
    criticalCount: items.filter((i) => i.severity === "critical" || i.severity === "high").length,
    status: items.length === 0 ? "compliant" : "attention",
  }));
}

export function buildComplianceScorecard(input: {
  complianceScore: number;
  fullyCompliantCount: number;
  totalRecords: number;
  averageCorrectionProgress: number;
}): ComplianceScorecard {
  return {
    overallScore: input.complianceScore,
    fullyCompliantPercent: Math.round((input.fullyCompliantCount / Math.max(input.totalRecords, 1)) * 100),
    correctionProgress: input.averageCorrectionProgress,
    grade: input.complianceScore >= 95 ? "A" : input.complianceScore >= 85 ? "B" : input.complianceScore >= 70 ? "C" : "D",
    generatedAt: new Date().toISOString(),
  };
}
