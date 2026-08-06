import { nextEscalationId, nextRecommendationId } from "./audit-store.js";
import type { AwarenessFinding, EscalationRecord, ExecutiveRecommendation } from "./types.js";

export function generateExecutiveRecommendations(findings: AwarenessFinding[]): ExecutiveRecommendation[] {
  const recommendations: ExecutiveRecommendation[] = [];
  const sorted = [...findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  for (let i = 0; i < sorted.length; i++) {
    const finding = sorted[i]!;
    recommendations.push({
      recommendationId: nextRecommendationId(),
      priority: i + 1,
      title: `Address: ${finding.title}`,
      description: `Review ${finding.domain} finding with severity ${finding.severity}. Evidence: ${finding.evidence.join("; ")}`,
      evidenceRefs: [...finding.evidence],
      findingIds: [finding.findingId],
      autoApplyForbidden: true,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      recommendationId: nextRecommendationId(),
      priority: 1,
      title: "Maintain continuous awareness cycle",
      description: "No open findings — continue evidence-based monitoring cadence",
      evidenceRefs: ["eesae:awareness_cycle"],
      findingIds: [],
      autoApplyForbidden: true,
    });
  }

  return recommendations;
}

export function escalateUnacknowledged(findings: AwarenessFinding[]): {
  findings: AwarenessFinding[];
  escalations: EscalationRecord[];
} {
  const now = new Date().toISOString();
  const escalations: EscalationRecord[] = [];
  const updated = findings.map((finding) => {
    if (finding.acknowledged) return finding;
    if (finding.severity !== "critical" && finding.severity !== "high") return finding;

    const escalation: EscalationRecord = {
      escalationId: nextEscalationId(),
      findingId: finding.findingId,
      timestamp: now,
      severity: finding.severity,
      message: `Unacknowledged ${finding.severity} finding requires Grand King / Pillow acknowledgement: ${finding.title}`,
      acknowledged: false,
    };
    escalations.push(escalation);
    return {
      ...finding,
      escalated: true,
      lastEscalatedAt: now,
    };
  });

  return { findings: updated, escalations };
}

export function acknowledgeFinding(
  findings: AwarenessFinding[],
  escalations: EscalationRecord[],
  findingId: string,
  acknowledgedBy = "grand_king",
): {
  findings: AwarenessFinding[];
  escalations: EscalationRecord[];
  acknowledged: boolean;
} {
  let acknowledged = false;
  const updatedFindings = findings.map((f) => {
    if (f.findingId !== findingId) return f;
    acknowledged = true;
    return { ...f, acknowledged: true, escalated: false };
  });
  const updatedEscalations = escalations.map((e) =>
    e.findingId === findingId ? { ...e, acknowledged: true } : e,
  );
  return { findings: updatedFindings, escalations: updatedEscalations, acknowledged };
}

function severityRank(severity: AwarenessFinding["severity"]): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
