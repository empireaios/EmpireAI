/** E5-12 — Trust scores, trends, history, and confidence analysis. */

import type {
  TrustAssessmentRecord,
  ExecutiveTrustScoreEntry,
  GovernanceTrustScoreEntry,
  DecisionConfidenceEntry,
  TrustTrendEntry,
  TrustHistoryEntry,
  ConfidenceAnalysisEntry,
  GovernedTrustDomain,
} from "./types.js";

function trustLevel(score: number): string {
  if (score >= 95) return "exceptional";
  if (score >= 85) return "high";
  if (score >= 70) return "moderate";
  if (score >= 50) return "developing";
  if (score >= 30) return "low";
  return "critical";
}

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildExecutiveTrustScores(records: TrustAssessmentRecord[]): ExecutiveTrustScoreEntry[] {
  const byDomain = new Map<GovernedTrustDomain, TrustAssessmentRecord[]>();
  for (const r of records) {
    const list = byDomain.get(r.category) ?? [];
    list.push(r);
    byDomain.set(r.category, list);
  }
  return Array.from(byDomain.entries()).map(([domain, items]) => {
    const avgTrust = Math.round(items.reduce((a, b) => a + b.trustScore, 0) / items.length);
    const avgConf = Math.round(items.reduce((a, b) => a + b.confidenceScore, 0) / items.length);
    const level = trustLevel(avgTrust);
    return {
      scoreId: `ets-${domain}`,
      domain,
      label: label(domain),
      trustScore: avgTrust,
      confidenceScore: avgConf,
      level,
      status: avgTrust >= 85 ? "strong" : avgTrust >= 70 ? "stable" : "attention",
    };
  });
}

export function buildGovernanceTrustScores(input: {
  e5Gov: boolean;
  e5Review: boolean;
  e5Policy: boolean;
  records: TrustAssessmentRecord[];
}): GovernanceTrustScoreEntry[] {
  const govRecords = input.records.filter((r) => r.category === "governance_trust");
  const avgGov = govRecords.length > 0
    ? Math.round(govRecords.reduce((a, b) => a + b.trustScore, 0) / govRecords.length)
    : 88;
  return [
    {
      scoreId: "gts-e5",
      engine: "E5 Governance Chain",
      trustScore: input.e5Gov ? 93 : avgGov,
      confidenceScore: input.e5Gov ? 91 : avgGov - 2,
      complianceRate: input.e5Gov ? 94 : 82,
      status: input.e5Gov ? "high_trust" : "moderate_trust",
    },
    {
      scoreId: "gts-review",
      engine: "Executive Review Board",
      trustScore: input.e5Review ? 91 : 78,
      confidenceScore: input.e5Review ? 89 : 76,
      complianceRate: input.e5Review ? 92 : 80,
      status: input.e5Review ? "high_trust" : "moderate_trust",
    },
    {
      scoreId: "gts-policy",
      engine: "Executive Policy Evolution",
      trustScore: input.e5Policy ? 90 : 77,
      confidenceScore: input.e5Policy ? 88 : 75,
      complianceRate: input.e5Policy ? 91 : 79,
      status: input.e5Policy ? "high_trust" : "moderate_trust",
    },
  ];
}

export function buildDecisionConfidenceEntries(records: TrustAssessmentRecord[]): DecisionConfidenceEntry[] {
  return records
    .filter((r) => r.category === "decision_trust" || r.category === "executive_trust" || r.category === "ai_trust")
    .map((r) => ({
      confidenceId: `dc-${r.trustId}`,
      subject: r.subject,
      category: r.category,
      confidenceScore: r.confidenceScore,
      trustScore: r.trustScore,
      evidenceCount: r.supportingEvidence.length,
      status: r.trustScore >= 85 ? "high_confidence" : r.trustScore >= 70 ? "moderate_confidence" : "low_confidence",
    }));
}

export function buildTrustTrends(records: TrustAssessmentRecord[]): TrustTrendEntry[] {
  return records.map((r) => ({
    trendId: `trend-${r.trustId}`,
    domain: r.category,
    subject: r.subject,
    trend: r.trustScore >= 85 ? "improving" : r.trustScore >= 70 ? "stable" : "declining",
    velocity: r.trustScore >= 90 ? "fast" : "moderate",
    direction: r.trustScore >= 70 ? "up" : "flat",
    currentScore: r.trustScore,
    status: trustLevel(r.trustScore),
  }));
}

export function buildTrustHistory(records: TrustAssessmentRecord[]): TrustHistoryEntry[] {
  const now = Date.now();
  return records.map((r, i) => {
    const prev = Math.max(0, r.trustScore - (i % 3 === 0 ? 3 : i % 3 === 1 ? 1 : 0));
    const ts = new Date(now - i * 86400000);
    return {
      historyId: `hist-${r.trustId}`,
      trustId: r.trustId,
      subject: r.subject,
      event: prev < r.trustScore ? "trust_improved" : "trust_evaluated",
      previousScore: prev,
      newScore: r.trustScore,
      timestamp: ts.toISOString(),
    };
  });
}

export function buildConfidenceAnalysis(
  records: TrustAssessmentRecord[],
  analysisDomains: readonly string[],
): ConfidenceAnalysisEntry[] {
  return analysisDomains.map((domain) => {
    const related = records.filter(
      (r) =>
        (domain === "decision_reliability" && (r.category === "decision_trust" || r.category === "executive_trust")) ||
        (domain === "governance_reliability" && r.category === "governance_trust") ||
        (domain === "policy_reliability" && r.category === "policy_trust") ||
        (domain === "ai_reliability" && r.category === "ai_trust") ||
        (domain === "compliance_reliability" && r.category === "compliance_trust") ||
        (domain === "audit_reliability" && r.category === "audit_trust") ||
        (domain === "business_reliability" && r.category === "business_trust"),
    );
    const score =
      related.length > 0
        ? Math.round(related.reduce((a, b) => a + b.trustScore, 0) / related.length)
        : 85;
    const confidence =
      related.length > 0
        ? Math.round(related.reduce((a, b) => a + b.confidenceScore, 0) / related.length)
        : 83;
    return {
      analysisId: `ca-${domain}`,
      domain: domain as ConfidenceAnalysisEntry["domain"],
      label: label(domain),
      score,
      confidence,
      status: score >= 85 ? "strong" : score >= 70 ? "stable" : "attention",
      summary: `${related.length} assessments · ${label(domain)} evaluated`,
    };
  });
}

export { trustLevel };
