import type { ProductImageReport } from "./types.js";

/** Authoritative in-memory Product Image store — preparation only. */
export class ImageStore {
  private reports = new Map<string, ProductImageReport>();
  private latestImageReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    imageReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ProductImageReport[]) {
    this.reports.clear();
    this.latestImageReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.imageReportId, clone(report));
      this.latestImageReportId = report.imageReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        imageReportId: report.imageReportId,
        action: "seed",
        details: `seeded image report product=${report.productName}`,
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

  get(imageReportId: string) {
    const report = this.reports.get(imageReportId);
    return report ? clone(report) : null;
  }

  getLatestImageReportId() {
    return this.latestImageReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: ProductImageReport, action = "save") {
    this.reports.set(report.imageReportId, clone(report));
    this.latestImageReportId = report.imageReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      imageReportId: report.imageReportId,
      action,
      details: `product=${report.productName} quality=${report.imageQualityStatus} compliance=${report.complianceStatus}`,
    });
    return clone(report);
  }

  markSubmitted(imageReportId: string, executiveReportId: string) {
    const current = this.reports.get(imageReportId);
    if (!current) return null;
    const updated: ProductImageReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: ProductImageReport): ProductImageReport {
  return {
    ...report,
    sourceImages: report.sourceImages.map((s) => ({ ...s })),
    processedImages: report.processedImages.map((p) => ({
      ...p,
      qualityNotes: [...p.qualityNotes],
      originalPreserved: true,
    })),
    imageVariants: report.imageVariants.map((v) => ({ ...v })),
    marketplaceTargets: [...report.marketplaceTargets],
    duplicateImageIds: [...report.duplicateImageIds],
    unusableImageIds: [...report.unusableImageIds],
    preservedMetadata: report.preservedMetadata.map((m) => ({ ...m })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
