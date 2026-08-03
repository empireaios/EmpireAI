import type { EbookReport } from "./types.js";

/** Authoritative in-memory ebook store — creation/export-ready assets only. */
export class EbookStore {
  private ebooks = new Map<string, EbookReport>();
  private latestEbookId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    ebookId: string;
    action: string;
    details: string;
  }> = [];

  seed(ebooks: EbookReport[]) {
    this.ebooks.clear();
    this.latestEbookId = null;
    this.auditTrail = [];
    for (const ebook of ebooks) {
      this.ebooks.set(ebook.ebookId, clone(ebook));
      this.latestEbookId = ebook.ebookId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        ebookId: ebook.ebookId,
        action: "seed",
        details: `seeded ebook=${ebook.ebookId} title=${ebook.productTitle} type=${ebook.productType}`,
      });
    }
  }

  count() {
    return this.ebooks.size;
  }

  list() {
    return [...this.ebooks.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(ebookId: string) {
    const ebook = this.ebooks.get(ebookId);
    return ebook ? clone(ebook) : null;
  }

  getLatestEbookId() {
    return this.latestEbookId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(ebook: EbookReport, action = "save") {
    this.ebooks.set(ebook.ebookId, clone(ebook));
    this.latestEbookId = ebook.ebookId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      ebookId: ebook.ebookId,
      action,
      details: `title=${ebook.productTitle} type=${ebook.productType} words=${ebook.wordCount} confidence=${ebook.confidenceScore}`,
    });
    return clone(ebook);
  }

  markSubmitted(ebookId: string, executiveReportId: string) {
    const current = this.ebooks.get(ebookId);
    if (!current) return null;
    const updated: EbookReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(ebook: EbookReport): EbookReport {
  return {
    ...ebook,
    chapterStructure: ebook.chapterStructure.map((c) => ({ ...c })),
    includedResources: [...ebook.includedResources],
    exportFormats: [...ebook.exportFormats],
    chapters: ebook.chapters.map((c) => ({ ...c })),
    outline: ebook.outline
      ? {
          ...ebook.outline,
          tableOfContents: [...ebook.outline.tableOfContents],
          sections: ebook.outline.sections.map((s) => ({ ...s })),
          learningObjectives: [...ebook.outline.learningObjectives],
        }
      : null,
    selfReviewFindings: ebook.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...ebook.traceabilityRefs],
    preservedDecisions: ebook.preservedDecisions.map((d) => ({ ...d })),
  };
}
