import type { EmpireCertificationReport } from "./types.js";

/** In-memory certification record store — never persists credentials. */
export class CertificationRecordStore {
  private reports: EmpireCertificationReport[] = [];
  add(report: EmpireCertificationReport) {
    this.reports.push(report);
  }
  list() {
    return [...this.reports];
  }
  clear() {
    this.reports = [];
  }
}
