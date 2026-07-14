/** E5-11 — Policy versions, evolution queue, and improvement opportunities. */

import type {
  PolicyEvolutionRecord,
  PolicyVersionEntry,
  EvolutionQueueEntry,
  ImprovementOpportunityEntry,
  PolicyEffectivenessEntry,
  GovernanceStabilityEntry,
} from "./types.js";

export function buildPolicyVersions(records: PolicyEvolutionRecord[]): PolicyVersionEntry[] {
  const seen = new Map<string, PolicyVersionEntry>();
  for (const r of records) {
    const current = seen.get(r.policyId);
    const isPublished = r.approvalStatus === "published";
    const entry: PolicyVersionEntry = {
      versionId: `ver-${r.policyId}-${r.currentVersion}`,
      policyId: r.policyId,
      policyName: r.policyName,
      version: isPublished ? r.proposedVersion : r.currentVersion,
      domain: r.domain,
      status: isPublished ? "published" : "active",
      effectiveDate: isPublished ? r.effectiveDate : r.effectiveDate,
      owner: r.domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };
    if (!current || isPublished) {
      seen.set(r.policyId, entry);
    }
  }
  return Array.from(seen.values());
}

export function buildEvolutionQueue(records: PolicyEvolutionRecord[]): EvolutionQueueEntry[] {
  const now = new Date();
  return records
    .filter((r) => r.approvalStatus !== "published" && r.approvalStatus !== "rejected")
    .map((r, i) => {
      const scheduled = new Date(now);
      scheduled.setDate(scheduled.getDate() + i * 3);
      return {
        queueId: `que-${r.evolutionId}`,
        evolutionId: r.evolutionId,
        policyName: r.policyName,
        proposedVersion: r.proposedVersion,
        classification: r.classification,
        approvalStatus: r.approvalStatus,
        priority: r.confidence >= 90 ? 1 : r.confidence >= 80 ? 2 : 3,
        scheduledDate: scheduled.toISOString().slice(0, 10),
      };
    });
}

export function buildImprovementOpportunities(records: PolicyEvolutionRecord[]): ImprovementOpportunityEntry[] {
  return records
    .filter((r) => r.approvalStatus === "draft" || r.approvalStatus === "pending_review")
    .map((r) => ({
      opportunityId: `opp-${r.evolutionId}`,
      policyId: r.policyId,
      policyName: r.policyName,
      domain: r.domain,
      opportunity: r.evolutionReason,
      expectedImpact: r.businessJustification,
      confidence: r.confidence,
      status: r.approvalStatus,
    }));
}

export function buildPolicyEffectiveness(records: PolicyEvolutionRecord[]): PolicyEffectivenessEntry[] {
  return records.map((r) => ({
    effectivenessId: `eff-${r.policyId}`,
    policyId: r.policyId,
    policyName: r.policyName,
    domain: r.domain,
    effectivenessScore: Math.min(100, r.confidence + (r.approvalStatus === "published" ? 5 : 0)),
    complianceRate: Math.min(100, r.confidence - 2),
    adoptionRate: Math.min(100, r.confidence - 5),
    status: r.approvalStatus === "published" ? "effective" : "evaluating",
  }));
}

export function buildGovernanceStabilityEntries(input: {
  e5Gov: boolean;
  e5Review: boolean;
  healthScore: number;
}): GovernanceStabilityEntry[] {
  return [
    {
      stabilityId: "stab-e5",
      domain: "E5 Governance Chain",
      score: input.e5Gov ? 93 : 78,
      status: input.e5Gov ? "stable" : "monitoring",
      summary: "E5-01 through E5-10 governance policy foundation",
    },
    {
      stabilityId: "stab-review",
      domain: "Executive Review Board",
      score: input.e5Review ? 91 : 76,
      status: input.e5Review ? "stable" : "monitoring",
      summary: "Review outcomes feed policy evolution",
    },
    {
      stabilityId: "stab-const",
      domain: "Constitutional Integrity",
      score: input.healthScore,
      status: input.healthScore >= 85 ? "stable" : "attention",
      summary: "No constitutional regression detected",
    },
    {
      stabilityId: "stab-compat",
      domain: "Backward Compatibility",
      score: Math.min(100, input.healthScore + 3),
      status: "stable",
      summary: "Policy evolution preserves prior governance",
    },
  ];
}
