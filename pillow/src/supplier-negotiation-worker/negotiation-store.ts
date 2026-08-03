import type { SupplierNegotiationReport } from "./types.js";

/** Authoritative in-memory Supplier Negotiation store — preparation only. */
export class NegotiationStore {
  private negotiations = new Map<string, SupplierNegotiationReport>();
  private latestNegotiationId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    negotiationId: string;
    action: string;
    details: string;
  }> = [];

  seed(negotiations: SupplierNegotiationReport[]) {
    this.negotiations.clear();
    this.latestNegotiationId = null;
    this.auditTrail = [];
    for (const negotiation of negotiations) {
      this.negotiations.set(negotiation.negotiationId, clone(negotiation));
      this.latestNegotiationId = negotiation.negotiationId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        negotiationId: negotiation.negotiationId,
        action: "seed",
        details: `seeded negotiation product=${negotiation.productName}`,
      });
    }
  }

  count() {
    return this.negotiations.size;
  }

  list() {
    return [...this.negotiations.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(negotiationId: string) {
    const negotiation = this.negotiations.get(negotiationId);
    return negotiation ? clone(negotiation) : null;
  }

  getLatestNegotiationId() {
    return this.latestNegotiationId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(negotiation: SupplierNegotiationReport, action = "save") {
    this.negotiations.set(negotiation.negotiationId, clone(negotiation));
    this.latestNegotiationId = negotiation.negotiationId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      negotiationId: negotiation.negotiationId,
      action,
      details: `product=${negotiation.productName} preferred=${negotiation.preferredSupplier?.supplierName ?? "none"} recommendation=${negotiation.recommendation}`,
    });
    return clone(negotiation);
  }

  markSubmitted(negotiationId: string, executiveReportId: string) {
    const current = this.negotiations.get(negotiationId);
    if (!current) return null;
    const updated: SupplierNegotiationReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(negotiation: SupplierNegotiationReport): SupplierNegotiationReport {
  return {
    ...negotiation,
    candidateSuppliers: negotiation.candidateSuppliers.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    preferredSupplier: negotiation.preferredSupplier
      ? {
          ...negotiation.preferredSupplier,
          strengths: [...negotiation.preferredSupplier.strengths],
          weaknesses: [...negotiation.preferredSupplier.weaknesses],
        }
      : null,
    negotiationOpportunities: [...negotiation.negotiationOpportunities],
    moqNegotiation: {
      ...negotiation.moqNegotiation,
      opportunities: [...negotiation.moqNegotiation.opportunities],
      questions: [...negotiation.moqNegotiation.questions],
    },
    priceNegotiation: {
      ...negotiation.priceNegotiation,
      opportunities: [...negotiation.priceNegotiation.opportunities],
      questions: [...negotiation.priceNegotiation.questions],
    },
    shippingNegotiation: {
      ...negotiation.shippingNegotiation,
      opportunities: [...negotiation.shippingNegotiation.opportunities],
      questions: [...negotiation.shippingNegotiation.questions],
    },
    fulfilmentQuestions: {
      ...negotiation.fulfilmentQuestions,
      opportunities: [...negotiation.fulfilmentQuestions.opportunities],
      questions: [...negotiation.fulfilmentQuestions.questions],
    },
    refundQuestions: {
      ...negotiation.refundQuestions,
      opportunities: [...negotiation.refundQuestions.opportunities],
      questions: [...negotiation.refundQuestions.questions],
    },
    supportingEvidence: negotiation.supportingEvidence.map((e) => ({ ...e })),
    evaluationIds: [...negotiation.evaluationIds],
  };
}
