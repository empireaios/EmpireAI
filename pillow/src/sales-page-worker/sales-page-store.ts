import type { SalesPageReport } from "./types.js";

/** Authoritative in-memory sales page store — structural copy/structure only. */
export class SalesPageStore {
  private pages = new Map<string, SalesPageReport>();
  private latestSalesPageId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    salesPageId: string;
    action: string;
    details: string;
  }> = [];

  seed(pages: SalesPageReport[]) {
    this.pages.clear();
    this.latestSalesPageId = null;
    this.auditTrail = [];
    for (const page of pages) {
      this.pages.set(page.salesPageId, clone(page));
      this.latestSalesPageId = page.salesPageId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        salesPageId: page.salesPageId,
        action: "seed",
        details: `seeded salesPage=${page.salesPageId} title=${page.productTitle} type=${page.pageType}`,
      });
    }
  }

  count() {
    return this.pages.size;
  }

  list() {
    return [...this.pages.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(salesPageId: string) {
    const page = this.pages.get(salesPageId);
    return page ? clone(page) : null;
  }

  getLatestSalesPageId() {
    return this.latestSalesPageId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(page: SalesPageReport, action = "save") {
    this.pages.set(page.salesPageId, clone(page));
    this.latestSalesPageId = page.salesPageId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      salesPageId: page.salesPageId,
      action,
      details: `title=${page.productTitle} type=${page.pageType} sections=${page.landingPageStructure.length} confidence=${page.confidenceScore}`,
    });
    return clone(page);
  }

  markSubmitted(salesPageId: string, executiveReportId: string) {
    const current = this.pages.get(salesPageId);
    if (!current) return null;
    const updated: SalesPageReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: SalesPageReport): SalesPageReport {
  return {
    ...report,
    landingPageStructure: report.landingPageStructure.map((s) => ({ ...s })),
    sectionsGenerated: [...report.sectionsGenerated],
    assetsReferenced: [...report.assetsReferenced],
    headlines: [...report.headlines],
    featureSections: report.featureSections.map((f) => ({ ...f })),
    pricingPresentation: report.pricingPresentation
      ? {
          ...report.pricingPresentation,
          tiers: report.pricingPresentation.tiers.map((t) => ({
            ...t,
            includes: [...t.includes],
          })),
        }
      : null,
    testimonials: report.testimonials.map((t) => ({ ...t, fabricated: false as const })),
    faqs: report.faqs.map((f) => ({ ...f })),
    ctas: report.ctas.map((c) => ({ ...c })),
    guarantees: report.guarantees.map((g) => ({ ...g })),
    exportFormats: [...report.exportFormats],
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
