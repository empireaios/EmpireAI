import type { InventoryReport } from "./types.js";

/** Authoritative in-memory Inventory store — monitoring only. */
export class InventoryStore {
  private reports = new Map<string, InventoryReport>();
  private latestInventoryReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    inventoryReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: InventoryReport[]) {
    this.reports.clear();
    this.latestInventoryReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.inventoryReportId, clone(report));
      this.latestInventoryReportId = report.inventoryReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        inventoryReportId: report.inventoryReportId,
        action: "seed",
        details: `seeded inventory product=${report.productName}`,
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

  get(inventoryReportId: string) {
    const report = this.reports.get(inventoryReportId);
    return report ? clone(report) : null;
  }

  getLatestInventoryReportId() {
    return this.latestInventoryReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: InventoryReport, action = "save") {
    this.reports.set(report.inventoryReportId, clone(report));
    this.latestInventoryReportId = report.inventoryReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      inventoryReportId: report.inventoryReportId,
      action,
      details: `product=${report.productName} stock=${report.currentStock} status=${report.stockStatus} reorder=${report.reorderPoint}`,
    });
    return clone(report);
  }

  markSubmitted(inventoryReportId: string, executiveReportId: string) {
    const current = this.reports.get(inventoryReportId);
    if (!current) return null;
    const updated: InventoryReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: InventoryReport): InventoryReport {
  return {
    ...report,
    inventoryAlerts: report.inventoryAlerts.map((a) => ({ ...a })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
