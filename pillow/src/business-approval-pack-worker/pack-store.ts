import type { BusinessApprovalPack } from "./types.js";

/** Authoritative in-memory Business Approval Pack store — packaging only. */
export class PackStore {
  private packs = new Map<string, BusinessApprovalPack>();
  private latestPackId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    approvalPackId: string;
    action: string;
    details: string;
  }> = [];

  seed(packs: BusinessApprovalPack[]) {
    this.packs.clear();
    this.latestPackId = null;
    this.auditTrail = [];
    for (const pack of packs) {
      this.packs.set(pack.approvalPackId, clone(pack));
      this.latestPackId = pack.approvalPackId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        approvalPackId: pack.approvalPackId,
        action: "seed",
        details: `seeded approval pack for mission=${pack.businessBuildMissionId}`,
      });
    }
  }

  count() {
    return this.packs.size;
  }

  list() {
    return [...this.packs.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(approvalPackId: string) {
    const pack = this.packs.get(approvalPackId);
    return pack ? clone(pack) : null;
  }

  getLatestPackId() {
    return this.latestPackId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(pack: BusinessApprovalPack, action = "save") {
    for (const [id, existing] of this.packs) {
      if (
        existing.businessBuildMissionId === pack.businessBuildMissionId &&
        id !== pack.approvalPackId
      ) {
        this.packs.delete(id);
        this.auditTrail.push({
          timestamp: new Date().toISOString(),
          approvalPackId: id,
          action: "supersede",
          details: `superseded_by=${pack.approvalPackId}`,
        });
      }
    }
    this.packs.set(pack.approvalPackId, clone(pack));
    this.latestPackId = pack.approvalPackId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      approvalPackId: pack.approvalPackId,
      action,
      details: `recommendation=${pack.recommendation} issues=${pack.outstandingIssues.length} major_risks=${pack.majorRisks.length}`,
    });
    return clone(pack);
  }

  markSubmitted(approvalPackId: string, executiveReportId: string) {
    const current = this.packs.get(approvalPackId);
    if (!current) return null;
    const updated: BusinessApprovalPack = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveCanonical(updated, "submit_approval_pack");
  }
}

function clone(pack: BusinessApprovalPack): BusinessApprovalPack {
  return {
    ...pack,
    majorOpportunities: [...pack.majorOpportunities],
    majorRisks: [...pack.majorRisks],
    requiredApprovals: [...pack.requiredApprovals],
    outstandingIssues: [...pack.outstandingIssues],
    unresolvedRisks: [...pack.unresolvedRisks],
    requiredGrandKingDecisions: [...pack.requiredGrandKingDecisions],
    supportingEvidence: pack.supportingEvidence.map((e) => ({ ...e })),
    facts: [...pack.facts],
    recommendationsOnly: [...pack.recommendationsOnly],
    assumptions: [...pack.assumptions],
    sourceRefs: { ...pack.sourceRefs },
    preservedDecisions: [...pack.preservedDecisions],
    traceabilityRefs: [...pack.traceabilityRefs],
  };
}
