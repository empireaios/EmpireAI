import type { SupplierDiscoveryReport } from "./types.js";

/** Authoritative in-memory Supplier Discovery store — discovery only. */
export class DiscoveryStore {
  private discoveries = new Map<string, SupplierDiscoveryReport>();
  private latestDiscoveryId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    discoveryId: string;
    action: string;
    details: string;
  }> = [];

  seed(discoveries: SupplierDiscoveryReport[]) {
    this.discoveries.clear();
    this.latestDiscoveryId = null;
    this.auditTrail = [];
    for (const discovery of discoveries) {
      this.discoveries.set(discovery.discoveryId, clone(discovery));
      this.latestDiscoveryId = discovery.discoveryId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        discoveryId: discovery.discoveryId,
        action: "seed",
        details: `seeded supplier=${discovery.supplierName} product=${discovery.productName}`,
      });
    }
  }

  count() {
    return this.discoveries.size;
  }

  list() {
    return [...this.discoveries.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(discoveryId: string) {
    const discovery = this.discoveries.get(discoveryId);
    return discovery ? clone(discovery) : null;
  }

  getLatestDiscoveryId() {
    return this.latestDiscoveryId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(discovery: SupplierDiscoveryReport, action = "save") {
    this.discoveries.set(discovery.discoveryId, clone(discovery));
    this.latestDiscoveryId = discovery.discoveryId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      discoveryId: discovery.discoveryId,
      action,
      details: `supplier=${discovery.supplierName} platform=${discovery.supplierPlatform} confidence=${discovery.confidenceScore}`,
    });
    return clone(discovery);
  }

  saveMany(discoveries: SupplierDiscoveryReport[], action = "save") {
    return discoveries.map((d) => this.save(d, action));
  }

  markSubmitted(discoveryId: string, executiveReportId: string) {
    const current = this.discoveries.get(discoveryId);
    if (!current) return null;
    const updated: SupplierDiscoveryReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(discovery: SupplierDiscoveryReport): SupplierDiscoveryReport {
  return {
    ...discovery,
    fieldAvailability: { ...discovery.fieldAvailability },
  };
}
