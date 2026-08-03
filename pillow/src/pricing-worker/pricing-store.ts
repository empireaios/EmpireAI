import type { PricingReport } from "./types.js";

/** Authoritative in-memory Pricing store — recommendation only. */
export class PricingStore {
  private reports = new Map<string, PricingReport>();
  private latestPricingId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    pricingId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: PricingReport[]) {
    this.reports.clear();
    this.latestPricingId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.pricingId, clone(report));
      this.latestPricingId = report.pricingId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        pricingId: report.pricingId,
        action: "seed",
        details: `seeded pricing product=${report.productName}`,
      });
    }
  }

  count() {
    return this.reports.size;
  }

  list() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(pricingId: string) {
    const report = this.reports.get(pricingId);
    return report ? clone(report) : null;
  }

  getLatestPricingId() {
    return this.latestPricingId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: PricingReport, action = "save") {
    this.reports.set(report.pricingId, clone(report));
    this.latestPricingId = report.pricingId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      pricingId: report.pricingId,
      action,
      details: `product=${report.productName} price=${report.recommendedSellingPrice} margin=${report.targetMargin}`,
    });
    return clone(report);
  }

  markSubmitted(pricingId: string, executiveReportId: string) {
    const current = this.reports.get(pricingId);
    if (!current) return null;
    const updated: PricingReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: PricingReport): PricingReport {
  return {
    ...report,
    supplierCost: { ...report.supplierCost },
    shippingCost: { ...report.shippingCost },
    marketplaceFees: { ...report.marketplaceFees },
    paymentFees: { ...report.paymentFees },
    advertisingAllocation: { ...report.advertisingAllocation },
    totalLandedCost: { ...report.totalLandedCost },
    targetProfit: { ...report.targetProfit },
    competitorPricing: report.competitorPricing.map((c) => ({ ...c })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
