/** R4-14 — Customer risk registry. */

import type {
  CustomerRiskAlert,
  CustomerRiskFailure,
  CustomerRiskRecord,
} from "./types.js";

export class CustomerRiskRegistry {
  private readonly records = new Map<string, CustomerRiskRecord>();
  private readonly alerts = new Map<string, CustomerRiskAlert>();
  private readonly failures = new Map<string, CustomerRiskFailure>();

  storeRecord(record: CustomerRiskRecord): void {
    this.records.set(record.customerRiskId, record);
  }

  storeAlert(alert: CustomerRiskAlert): void {
    this.alerts.set(alert.alertId, alert);
  }

  storeFailure(failure: CustomerRiskFailure): void {
    this.failures.set(failure.failureId, failure);
  }

  getRecord(id: string): CustomerRiskRecord | null {
    return this.records.get(id) ?? null;
  }

  listRecords(): CustomerRiskRecord[] {
    return [...this.records.values()];
  }

  listAlerts(): CustomerRiskAlert[] {
    return [...this.alerts.values()];
  }

  listFailures(): CustomerRiskFailure[] {
    return [...this.failures.values()];
  }

  resetForTesting(): void {
    this.records.clear();
    this.alerts.clear();
    this.failures.clear();
  }
}
