import type { DigitalDeliveryReport } from "./types.js";

/** Authoritative in-memory delivery store — structural fulfilment only. */
export class DigitalDeliveryStore {
  private deliveries = new Map<string, DigitalDeliveryReport>();
  private latestDeliveryId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    deliveryId: string;
    action: string;
    details: string;
  }> = [];

  seed(deliveries: DigitalDeliveryReport[]) {
    this.deliveries.clear();
    this.latestDeliveryId = null;
    this.auditTrail = [];
    for (const delivery of deliveries) {
      this.deliveries.set(delivery.deliveryId, clone(delivery));
      this.latestDeliveryId = delivery.deliveryId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        deliveryId: delivery.deliveryId,
        action: "seed",
        details: `seeded delivery=${delivery.deliveryId} title=${delivery.productTitle} type=${delivery.deliveryType}`,
      });
    }
  }

  count() {
    return this.deliveries.size;
  }

  list() {
    return [...this.deliveries.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(deliveryId: string) {
    const delivery = this.deliveries.get(deliveryId);
    return delivery ? clone(delivery) : null;
  }

  getLatestDeliveryId() {
    return this.latestDeliveryId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(delivery: DigitalDeliveryReport, action = "save") {
    this.deliveries.set(delivery.deliveryId, clone(delivery));
    this.latestDeliveryId = delivery.deliveryId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      deliveryId: delivery.deliveryId,
      action,
      details: `title=${delivery.productTitle} type=${delivery.deliveryType} status=${delivery.deliveryStatus} confidence=${delivery.confidenceScore}`,
    });
    return clone(delivery);
  }

  markSubmitted(deliveryId: string, executiveReportId: string) {
    const current = this.deliveries.get(deliveryId);
    if (!current) return null;
    const updated: DigitalDeliveryReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: DigitalDeliveryReport): DigitalDeliveryReport {
  return {
    ...report,
    deliveredAssets: report.deliveredAssets.map((a) => ({ ...a })),
    accessGrants: report.accessGrants.map((g) => ({ ...g })),
    deliverySteps: report.deliverySteps.map((s) => ({ ...s })),
    supportedDeliveryMethods: [...report.supportedDeliveryMethods],
    supportedDeliveryTypes: [...report.supportedDeliveryTypes],
    secureDownloadLinks: report.secureDownloadLinks.map((l) => ({
      ...l,
      authorized: true as const,
      tokenPresent: false as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
