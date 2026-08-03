/** X2-21 — In-memory portfolio certification report store. */

import type { PortfolioCertificationReport } from "./types.js";

export class CertificationRecordStore {
  private reports: PortfolioCertificationReport[] = [];

  append(report: PortfolioCertificationReport): void {
    this.reports.push(report);
    if (this.reports.length > 100) this.reports.splice(0, this.reports.length - 100);
  }

  list(): PortfolioCertificationReport[] {
    return [...this.reports];
  }

  latest(): PortfolioCertificationReport | null {
    return this.reports[this.reports.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.reports = [];
  }
}
