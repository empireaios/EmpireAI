/** X2-10 — In-memory certification report store. */

import type { PortfolioIntelligenceCertificationReport } from "./types.js";

export class CertificationRecordStore {
  private reports: PortfolioIntelligenceCertificationReport[] = [];

  append(report: PortfolioIntelligenceCertificationReport): void {
    this.reports.push(report);
    if (this.reports.length > 100) this.reports.splice(0, this.reports.length - 100);
  }

  list(): PortfolioIntelligenceCertificationReport[] {
    return [...this.reports];
  }

  latest(): PortfolioIntelligenceCertificationReport | null {
    return this.reports[this.reports.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.reports = [];
  }
}
