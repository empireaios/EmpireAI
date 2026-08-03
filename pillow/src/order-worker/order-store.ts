import type { OrderReport } from "./types.js";

/** Authoritative in-memory Order store — lifecycle tracking only. */
export class OrderStore {
  private reports = new Map<string, OrderReport>();
  private latestOrderReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    orderReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: OrderReport[]) {
    this.reports.clear();
    this.latestOrderReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.orderReportId, clone(report));
      this.latestOrderReportId = report.orderReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        orderReportId: report.orderReportId,
        action: "seed",
        details: `seeded order=${report.orderId} product=${report.productName}`,
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

  get(orderReportId: string) {
    const report = this.reports.get(orderReportId);
    return report ? clone(report) : null;
  }

  getLatestOrderReportId() {
    return this.latestOrderReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: OrderReport, action = "save") {
    this.reports.set(report.orderReportId, clone(report));
    this.latestOrderReportId = report.orderReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      orderReportId: report.orderReportId,
      action,
      details: `order=${report.orderId} status=${report.orderStatus} fulfilment=${report.fulfilmentStatus} shipping=${report.shippingStatus}`,
    });
    return clone(report);
  }

  markSubmitted(orderReportId: string, executiveReportId: string) {
    const current = this.reports.get(orderReportId);
    if (!current) return null;
    const updated: OrderReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: OrderReport): OrderReport {
  return {
    ...report,
    exceptions: report.exceptions.map((e) => ({ ...e })),
    customerUpdates: report.customerUpdates.map((u) => ({ ...u })),
    escalations: report.escalations.map((e) => ({ ...e })),
    fulfilmentHistory: report.fulfilmentHistory.map((h) => ({ ...h })),
    orderHistory: report.orderHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
